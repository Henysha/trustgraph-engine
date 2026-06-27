"""Initial TrustGraph schema.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-06-26
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    transaction_type = sa.Enum(
        "CONTRIBUTION",
        "FUNDING_REQUEST",
        "DISBURSEMENT",
        "REPAYMENT",
        name="transactiontype",
    )
    transaction_status = sa.Enum("PENDING", "SUCCESS", "FAILED", name="transactionstatus")
    risk_subject_type = sa.Enum("USER", "GROUP", "TRANSACTION", name="risksubjecttype")
    risk_level = sa.Enum("LOW", "MEDIUM", "HIGH", name="risklevel")
    recommendation = sa.Enum("APPROVE", "REVIEW", "BLOCK", name="recommendation")
    alert_severity = sa.Enum("LOW", "MEDIUM", "HIGH", "CRITICAL", name="alertseverity")
    alert_status = sa.Enum("OPEN", "RESOLVED", name="alertstatus")
    review_status = sa.Enum("OPEN", "APPROVED", "REJECTED", name="reviewcasestatus")
    trust_edge_type = sa.Enum(
        "SAME_GROUP",
        "GUARANTOR",
        "FREQUENT_COUNTERPARTY",
        name="trustedgetype",
    )

    op.create_table(
        "user_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("external_id", sa.String(length=120), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("account_age_days", sa.Integer(), nullable=False),
        sa.Column("contribution_count", sa.Integer(), nullable=False),
        sa.Column("failed_transaction_count", sa.Integer(), nullable=False),
        sa.Column("successful_repayment_count", sa.Integer(), nullable=False),
        sa.Column("reputation_score", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("external_id"),
    )
    op.create_index("ix_user_profiles_external_id", "user_profiles", ["external_id"])

    op.create_table(
        "group_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("external_id", sa.String(length=120), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("member_count", sa.Integer(), nullable=False),
        sa.Column("default_rate", sa.Numeric(5, 4), nullable=False),
        sa.Column("suspicious_activity_count", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("external_id"),
    )
    op.create_index("ix_group_profiles_external_id", "group_profiles", ["external_id"])

    op.create_table(
        "transaction_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user_profiles.id"), nullable=False),
        sa.Column("group_id", sa.Integer(), sa.ForeignKey("group_profiles.id"), nullable=True),
        sa.Column("transaction_type", transaction_type, nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("status", transaction_status, nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_transaction_events_user_id", "transaction_events", ["user_id"])

    op.create_table(
        "trust_signals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user_profiles.id"), nullable=False),
        sa.Column("signal_type", sa.String(length=100), nullable=False),
        sa.Column("value", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_trust_signals_user_id", "trust_signals", ["user_id"])

    op.create_table(
        "risk_scores",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("subject_type", risk_subject_type, nullable=False),
        sa.Column("transaction_id", sa.Integer(), sa.ForeignKey("transaction_events.id"), nullable=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user_profiles.id"), nullable=True),
        sa.Column("group_id", sa.Integer(), sa.ForeignKey("group_profiles.id"), nullable=True),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("level", risk_level, nullable=False),
        sa.Column("reasons", sa.JSON(), nullable=False),
        sa.Column("recommendation", recommendation, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "fraud_alerts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("transaction_id", sa.Integer(), sa.ForeignKey("transaction_events.id"), nullable=True),
        sa.Column("risk_score_id", sa.Integer(), sa.ForeignKey("risk_scores.id"), nullable=False),
        sa.Column("severity", alert_severity, nullable=False),
        sa.Column("status", alert_status, nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "review_cases",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("transaction_id", sa.Integer(), sa.ForeignKey("transaction_events.id"), nullable=True),
        sa.Column("risk_score_id", sa.Integer(), sa.ForeignKey("risk_scores.id"), nullable=False),
        sa.Column("status", review_status, nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("analyst_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "trust_edges",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_user_id", sa.Integer(), sa.ForeignKey("user_profiles.id"), nullable=False),
        sa.Column("target_user_id", sa.Integer(), sa.ForeignKey("user_profiles.id"), nullable=False),
        sa.Column("edge_type", trust_edge_type, nullable=False),
        sa.Column("weight", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_trust_edges_source_user_id", "trust_edges", ["source_user_id"])
    op.create_index("ix_trust_edges_target_user_id", "trust_edges", ["target_user_id"])


def downgrade() -> None:
    op.drop_index("ix_trust_edges_target_user_id", table_name="trust_edges")
    op.drop_index("ix_trust_edges_source_user_id", table_name="trust_edges")
    op.drop_table("trust_edges")
    op.drop_table("review_cases")
    op.drop_table("fraud_alerts")
    op.drop_table("risk_scores")
    op.drop_index("ix_trust_signals_user_id", table_name="trust_signals")
    op.drop_table("trust_signals")
    op.drop_index("ix_transaction_events_user_id", table_name="transaction_events")
    op.drop_table("transaction_events")
    op.drop_index("ix_group_profiles_external_id", table_name="group_profiles")
    op.drop_table("group_profiles")
    op.drop_index("ix_user_profiles_external_id", table_name="user_profiles")
    op.drop_table("user_profiles")
