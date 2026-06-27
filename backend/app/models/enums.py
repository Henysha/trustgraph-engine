from enum import StrEnum


class TransactionStatus(StrEnum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class TransactionType(StrEnum):
    CONTRIBUTION = "CONTRIBUTION"
    FUNDING_REQUEST = "FUNDING_REQUEST"
    DISBURSEMENT = "DISBURSEMENT"
    REPAYMENT = "REPAYMENT"


class RiskSubjectType(StrEnum):
    USER = "USER"
    GROUP = "GROUP"
    TRANSACTION = "TRANSACTION"


class RiskLevel(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class Recommendation(StrEnum):
    APPROVE = "APPROVE"
    REVIEW = "REVIEW"
    BLOCK = "BLOCK"


class AlertSeverity(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AlertStatus(StrEnum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"


class ReviewCaseStatus(StrEnum):
    OPEN = "OPEN"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class TrustEdgeType(StrEnum):
    SAME_GROUP = "SAME_GROUP"
    GUARANTOR = "GUARANTOR"
    FREQUENT_COUNTERPARTY = "FREQUENT_COUNTERPARTY"
