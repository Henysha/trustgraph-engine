from dataclasses import dataclass, field
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import (
    FraudAlert,
    GroupProfile,
    ReviewCase,
    RiskScore,
    TransactionEvent,
    TrustEdge,
    TrustSignal,
    UserProfile,
)
from app.models.enums import (
    AlertSeverity,
    Recommendation,
    ReviewCaseStatus,
    RiskLevel,
    RiskSubjectType,
    TransactionType,
)


@dataclass(frozen=True)
class RiskAssessment:
    score: int
    level: RiskLevel
    reasons: list[str] = field(default_factory=list)
    recommendation: Recommendation = Recommendation.APPROVE


class RiskScoringService:
    def __init__(self, db: Session | None = None):
        self.db = db

    def assess(
        self,
        *,
        user: UserProfile,
        transaction: TransactionEvent | None = None,
        group: GroupProfile | None = None,
        trust_signals: list[TrustSignal] | None = None,
        has_high_risk_connection: bool = False,
    ) -> RiskAssessment:
        score = 0
        reasons: list[str] = []
        trust_signals = trust_signals or []

        if user.account_age_days < 30:
            score += 20
            reasons.append("+20 account age is under 30 days")

        if user.failed_transaction_count >= 3:
            score += 15
            reasons.append("+15 user has at least 3 failed transactions")

        if (
            transaction
            and user.contribution_count < 3
            and transaction.transaction_type == TransactionType.FUNDING_REQUEST
        ):
            score += 20
            reasons.append("+20 low contribution history on funding request")

        if user.reputation_score < 50:
            score += 20
            reasons.append("+20 reputation score is below 50")

        if any(signal.value < 0 for signal in trust_signals):
            score += 10
            reasons.append("+10 user has negative trust signals")

        if transaction and transaction.amount > Decimal("1000.00"):
            score += 25
            reasons.append("+25 transaction amount is greater than 1000")

        if group and group.default_rate > Decimal("0.15"):
            score += 15
            reasons.append("+15 group default rate is greater than 0.15")

        if has_high_risk_connection:
            score += 15
            reasons.append("+15 user network contains high-risk connected users")

        if user.successful_repayment_count >= 5:
            score -= 10
            reasons.append("-10 user has at least 5 successful repayments")

        if user.contribution_count >= 10:
            score -= 10
            reasons.append("-10 user has at least 10 contributions")

        if user.reputation_score >= 80:
            score -= 10
            reasons.append("-10 reputation score is at least 80")

        score = max(0, min(score, 100))
        level = self.risk_level(score)
        recommendation = self.recommendation(level)

        if not reasons:
            reasons.append("No risk factors changed the baseline score")

        return RiskAssessment(
            score=score,
            level=level,
            reasons=reasons,
            recommendation=recommendation,
        )

    def score_transaction(self, transaction_id: int) -> RiskScore:
        if self.db is None:
            raise ValueError("A database session is required to persist a transaction score")

        transaction = self.db.get(TransactionEvent, transaction_id)
        if transaction is None:
            raise LookupError("Transaction not found")

        user = self.db.get(UserProfile, transaction.user_id)
        group = self.db.get(GroupProfile, transaction.group_id) if transaction.group_id else None
        trust_signals = list(
            self.db.scalars(select(TrustSignal).where(TrustSignal.user_id == transaction.user_id))
        )
        has_high_risk_connection = self._has_high_risk_connection(transaction.user_id)
        assessment = self.assess(
            user=user,
            transaction=transaction,
            group=group,
            trust_signals=trust_signals,
            has_high_risk_connection=has_high_risk_connection,
        )

        risk_score = RiskScore(
            subject_type=RiskSubjectType.TRANSACTION,
            transaction_id=transaction.id,
            user_id=transaction.user_id,
            group_id=transaction.group_id,
            score=assessment.score,
            level=assessment.level,
            reasons=assessment.reasons,
            recommendation=assessment.recommendation,
        )
        self.db.add(risk_score)
        self.db.flush()

        reason = "; ".join(assessment.reasons)
        if assessment.level == RiskLevel.HIGH:
            self.db.add(
                FraudAlert(
                    transaction_id=transaction.id,
                    risk_score_id=risk_score.id,
                    severity=AlertSeverity.HIGH,
                    reason=reason,
                )
            )

        if assessment.level in {RiskLevel.MEDIUM, RiskLevel.HIGH}:
            self.db.add(
                ReviewCase(
                    transaction_id=transaction.id,
                    risk_score_id=risk_score.id,
                    status=ReviewCaseStatus.OPEN,
                    summary=f"{assessment.level.value.title()}-risk transaction requires review: {reason}",
                )
            )

        self.db.commit()
        self.db.refresh(risk_score)
        return risk_score

    def latest_user_risk(self, user_id: int) -> RiskScore | None:
        if self.db is None:
            raise ValueError("A database session is required")
        return self.db.scalar(
            select(RiskScore)
            .where(RiskScore.user_id == user_id)
            .order_by(RiskScore.created_at.desc())
            .limit(1)
        )

    def latest_group_risk(self, group_id: int) -> RiskScore | None:
        if self.db is None:
            raise ValueError("A database session is required")
        return self.db.scalar(
            select(RiskScore)
            .where(RiskScore.group_id == group_id)
            .order_by(RiskScore.created_at.desc())
            .limit(1)
        )

    def _has_high_risk_connection(self, user_id: int) -> bool:
        if self.db is None:
            return False

        edges = list(
            self.db.scalars(
                select(TrustEdge).where(
                    (TrustEdge.source_user_id == user_id) | (TrustEdge.target_user_id == user_id)
                )
            )
        )
        connected_user_ids = {
            edge.target_user_id if edge.source_user_id == user_id else edge.source_user_id
            for edge in edges
        }

        return any(
            self.db.scalar(
                select(RiskScore)
                .where(RiskScore.user_id == connected_user_id, RiskScore.level == RiskLevel.HIGH)
                .order_by(RiskScore.created_at.desc())
                .limit(1)
            )
            is not None
            for connected_user_id in connected_user_ids
        )

    @staticmethod
    def risk_level(score: int) -> RiskLevel:
        if score <= 30:
            return RiskLevel.LOW
        if score <= 70:
            return RiskLevel.MEDIUM
        return RiskLevel.HIGH

    @staticmethod
    def recommendation(level: RiskLevel) -> Recommendation:
        if level == RiskLevel.LOW:
            return Recommendation.APPROVE
        if level == RiskLevel.MEDIUM:
            return Recommendation.REVIEW
        return Recommendation.BLOCK
