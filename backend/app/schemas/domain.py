from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

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


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserProfileCreate(BaseModel):
    external_id: str
    full_name: str
    email: str | None = None
    account_age_days: int = 0
    contribution_count: int = 0
    failed_transaction_count: int = 0
    successful_repayment_count: int = 0
    reputation_score: int = Field(default=50, ge=0, le=100)


class UserProfileRead(UserProfileCreate, ORMModel):
    id: int
    created_at: datetime


class GroupProfileCreate(BaseModel):
    external_id: str
    name: str
    member_count: int = 0
    default_rate: Decimal = Field(default=Decimal("0.0000"), ge=0, le=1)
    suspicious_activity_count: int = 0


class GroupProfileRead(GroupProfileCreate, ORMModel):
    id: int
    created_at: datetime


class TransactionEventCreate(BaseModel):
    user_id: int
    group_id: int | None = None
    transaction_type: TransactionType
    amount: Decimal
    currency: str = "USD"
    status: TransactionStatus = TransactionStatus.PENDING
    metadata_json: dict = Field(default_factory=dict)


class TransactionEventRead(TransactionEventCreate, ORMModel):
    id: int
    created_at: datetime


class TrustSignalCreate(BaseModel):
    signal_type: str
    value: int = Field(ge=-100, le=100)
    description: str | None = None


class TrustSignalRead(TrustSignalCreate, ORMModel):
    id: int
    user_id: int
    created_at: datetime


class RiskScoreRead(ORMModel):
    id: int
    subject_type: RiskSubjectType
    transaction_id: int | None
    user_id: int | None
    group_id: int | None
    score: int
    level: RiskLevel
    reasons: list[str]
    recommendation: Recommendation
    created_at: datetime


class FraudAlertRead(ORMModel):
    id: int
    transaction_id: int | None
    risk_score_id: int
    severity: AlertSeverity
    status: AlertStatus
    reason: str
    created_at: datetime


class ReviewCaseRead(ORMModel):
    id: int
    transaction_id: int | None
    risk_score_id: int
    status: ReviewCaseStatus
    summary: str
    analyst_note: str | None
    created_at: datetime


class TrustEdgeCreate(BaseModel):
    source_user_id: int
    target_user_id: int
    edge_type: TrustEdgeType
    weight: int = Field(default=50, ge=0, le=100)


class TrustEdgeRead(TrustEdgeCreate, ORMModel):
    id: int
    created_at: datetime


class NetworkRead(BaseModel):
    user_id: int
    edges: list[TrustEdgeRead]


class ResolutionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    analyst_note: str | None = Field(default=None, alias="analystNote")
