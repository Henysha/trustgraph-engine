from decimal import Decimal

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.models.entities import (
    FraudAlert,
    GroupProfile,
    ReviewCase,
    RiskScore,
    TransactionEvent,
    TrustSignal,
    UserProfile,
)
from app.models.enums import Recommendation, RiskLevel, RiskSubjectType, TransactionType
from app.services.risk import RiskScoringService


@pytest.fixture()
def db_session() -> Session:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)

    with session_factory() as session:
        yield session


def test_low_risk_profile_is_approved() -> None:
    user = UserProfile(
        external_id="user_low",
        full_name="Low Risk User",
        account_age_days=180,
        contribution_count=12,
        failed_transaction_count=0,
        successful_repayment_count=5,
        reputation_score=85,
    )
    transaction = TransactionEvent(
        user_id=1,
        transaction_type=TransactionType.CONTRIBUTION,
        amount=Decimal("75.00"),
    )

    assessment = RiskScoringService().assess(user=user, transaction=transaction)

    assert assessment.score == 0
    assert assessment.level == RiskLevel.LOW
    assert assessment.recommendation == Recommendation.APPROVE
    assert "-10 user has at least 5 successful repayments" in assessment.reasons


def test_medium_risk_profile_requires_review() -> None:
    user = UserProfile(
        external_id="user_medium",
        full_name="Medium Risk User",
        account_age_days=10,
        contribution_count=1,
        failed_transaction_count=3,
        successful_repayment_count=0,
        reputation_score=70,
    )
    transaction = TransactionEvent(
        user_id=1,
        transaction_type=TransactionType.FUNDING_REQUEST,
        amount=Decimal("100.00"),
    )

    assessment = RiskScoringService().assess(user=user, transaction=transaction)

    assert assessment.score == 55
    assert assessment.level == RiskLevel.MEDIUM
    assert assessment.recommendation == Recommendation.REVIEW


def test_high_risk_transaction_is_blocked_with_explainable_reasons() -> None:
    user = UserProfile(
        external_id="user_high",
        full_name="High Risk User",
        account_age_days=5,
        contribution_count=0,
        failed_transaction_count=4,
        successful_repayment_count=0,
        reputation_score=25,
    )
    group = GroupProfile(
        external_id="group_high",
        name="High Risk Group",
        member_count=10,
        default_rate=Decimal("0.2500"),
        suspicious_activity_count=4,
    )
    transaction = TransactionEvent(
        user_id=1,
        group_id=1,
        transaction_type=TransactionType.FUNDING_REQUEST,
        amount=Decimal("2500.00"),
    )
    signals = [TrustSignal(user_id=1, signal_type="complaint", value=-30)]

    assessment = RiskScoringService().assess(
        user=user,
        transaction=transaction,
        group=group,
        trust_signals=signals,
        has_high_risk_connection=True,
    )

    assert assessment.score == 100
    assert assessment.level == RiskLevel.HIGH
    assert assessment.recommendation == Recommendation.BLOCK
    assert "+25 transaction amount is greater than 1000" in assessment.reasons
    assert "+15 group default rate is greater than 0.15" in assessment.reasons


def test_medium_risk_transaction_creates_review_case_without_alert(db_session: Session) -> None:
    user = UserProfile(
        external_id="user_medium_db",
        full_name="Medium Risk DB User",
        account_age_days=10,
        contribution_count=1,
        failed_transaction_count=0,
        successful_repayment_count=0,
        reputation_score=70,
    )
    transaction = TransactionEvent(
        user=user,
        transaction_type=TransactionType.FUNDING_REQUEST,
        amount=Decimal("100.00"),
    )
    db_session.add_all([user, transaction])
    db_session.commit()

    risk_score = RiskScoringService(db_session).score_transaction(transaction.id)

    alerts = list(db_session.scalars(select(FraudAlert)))
    review_cases = list(db_session.scalars(select(ReviewCase)))

    assert risk_score.score == 40
    assert risk_score.level == RiskLevel.MEDIUM
    assert risk_score.subject_type == RiskSubjectType.TRANSACTION
    assert alerts == []
    assert len(review_cases) == 1
    assert review_cases[0].risk_score_id == risk_score.id


def test_high_risk_transaction_creates_alert_and_review_case(db_session: Session) -> None:
    user = UserProfile(
        external_id="user_high_db",
        full_name="High Risk DB User",
        account_age_days=5,
        contribution_count=0,
        failed_transaction_count=3,
        successful_repayment_count=0,
        reputation_score=25,
    )
    group = GroupProfile(
        external_id="group_high_db",
        name="High Risk DB Group",
        default_rate=Decimal("0.2000"),
    )
    transaction = TransactionEvent(
        user=user,
        group=group,
        transaction_type=TransactionType.FUNDING_REQUEST,
        amount=Decimal("2500.00"),
    )
    signal = TrustSignal(user=user, signal_type="complaint", value=-20)
    db_session.add_all([user, group, transaction, signal])
    db_session.commit()

    risk_score = RiskScoringService(db_session).score_transaction(transaction.id)

    alerts = list(db_session.scalars(select(FraudAlert)))
    review_cases = list(db_session.scalars(select(ReviewCase)))
    persisted_scores = list(db_session.scalars(select(RiskScore)))

    assert risk_score.level == RiskLevel.HIGH
    assert risk_score.recommendation == Recommendation.BLOCK
    assert len(persisted_scores) == 1
    assert len(alerts) == 1
    assert alerts[0].risk_score_id == risk_score.id
    assert len(review_cases) == 1
    assert review_cases[0].risk_score_id == risk_score.id
