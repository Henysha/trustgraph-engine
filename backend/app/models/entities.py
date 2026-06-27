from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import (
    AlertSeverity,
    AlertStatus,
    Recommendation,
    ReviewCaseStatus,
    RiskLevel,
    RiskSubjectType,
    TransactionStatus,
    TransactionType,
    TrustEdgeType,
)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class UserProfile(Base, TimestampMixin):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    external_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    account_age_days: Mapped[int] = mapped_column(Integer, default=0)
    contribution_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_transaction_count: Mapped[int] = mapped_column(Integer, default=0)
    successful_repayment_count: Mapped[int] = mapped_column(Integer, default=0)
    reputation_score: Mapped[int] = mapped_column(Integer, default=50)

    transactions: Mapped[list["TransactionEvent"]] = relationship(back_populates="user")
    trust_signals: Mapped[list["TrustSignal"]] = relationship(back_populates="user")


class GroupProfile(Base, TimestampMixin):
    __tablename__ = "group_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    external_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    member_count: Mapped[int] = mapped_column(Integer, default=0)
    default_rate: Mapped[Decimal] = mapped_column(Numeric(5, 4), default=Decimal("0.0000"))
    suspicious_activity_count: Mapped[int] = mapped_column(Integer, default=0)

    transactions: Mapped[list["TransactionEvent"]] = relationship(back_populates="group")


class TransactionEvent(Base, TimestampMixin):
    __tablename__ = "transaction_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user_profiles.id"), index=True)
    group_id: Mapped[int | None] = mapped_column(ForeignKey("group_profiles.id"), nullable=True)
    transaction_type: Mapped[TransactionType] = mapped_column(Enum(TransactionType))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    status: Mapped[TransactionStatus] = mapped_column(
        Enum(TransactionStatus), default=TransactionStatus.PENDING
    )
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)

    user: Mapped[UserProfile] = relationship(back_populates="transactions")
    group: Mapped[GroupProfile | None] = relationship(back_populates="transactions")
    risk_scores: Mapped[list["RiskScore"]] = relationship(back_populates="transaction")


class TrustSignal(Base, TimestampMixin):
    __tablename__ = "trust_signals"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user_profiles.id"), index=True)
    signal_type: Mapped[str] = mapped_column(String(100))
    value: Mapped[int] = mapped_column(Integer)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped[UserProfile] = relationship(back_populates="trust_signals")


class RiskScore(Base, TimestampMixin):
    __tablename__ = "risk_scores"

    id: Mapped[int] = mapped_column(primary_key=True)
    subject_type: Mapped[RiskSubjectType] = mapped_column(Enum(RiskSubjectType))
    transaction_id: Mapped[int | None] = mapped_column(ForeignKey("transaction_events.id"), nullable=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("user_profiles.id"), nullable=True)
    group_id: Mapped[int | None] = mapped_column(ForeignKey("group_profiles.id"), nullable=True)
    score: Mapped[int] = mapped_column(Integer)
    level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel))
    reasons: Mapped[list[str]] = mapped_column(JSON, default=list)
    recommendation: Mapped[Recommendation] = mapped_column(Enum(Recommendation))

    transaction: Mapped[TransactionEvent | None] = relationship(back_populates="risk_scores")


class FraudAlert(Base, TimestampMixin):
    __tablename__ = "fraud_alerts"

    id: Mapped[int] = mapped_column(primary_key=True)
    transaction_id: Mapped[int | None] = mapped_column(ForeignKey("transaction_events.id"), nullable=True)
    risk_score_id: Mapped[int] = mapped_column(ForeignKey("risk_scores.id"))
    severity: Mapped[AlertSeverity] = mapped_column(Enum(AlertSeverity), default=AlertSeverity.HIGH)
    status: Mapped[AlertStatus] = mapped_column(Enum(AlertStatus), default=AlertStatus.OPEN)
    reason: Mapped[str] = mapped_column(Text)


class ReviewCase(Base, TimestampMixin):
    __tablename__ = "review_cases"

    id: Mapped[int] = mapped_column(primary_key=True)
    transaction_id: Mapped[int | None] = mapped_column(ForeignKey("transaction_events.id"), nullable=True)
    risk_score_id: Mapped[int] = mapped_column(ForeignKey("risk_scores.id"))
    status: Mapped[ReviewCaseStatus] = mapped_column(
        Enum(ReviewCaseStatus), default=ReviewCaseStatus.OPEN
    )
    summary: Mapped[str] = mapped_column(Text)
    analyst_note: Mapped[str | None] = mapped_column(Text, nullable=True)


class TrustEdge(Base, TimestampMixin):
    __tablename__ = "trust_edges"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_user_id: Mapped[int] = mapped_column(ForeignKey("user_profiles.id"), index=True)
    target_user_id: Mapped[int] = mapped_column(ForeignKey("user_profiles.id"), index=True)
    edge_type: Mapped[TrustEdgeType] = mapped_column(Enum(TrustEdgeType))
    weight: Mapped[int] = mapped_column(Integer, default=50)
