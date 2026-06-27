from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import entities  # noqa: F401


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)

    def override_get_db():
        with engine.begin() as connection:
            from sqlalchemy.orm import Session

            with Session(bind=connection, expire_on_commit=False) as session:
                yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def create_user(client: TestClient, payload: dict) -> dict:
    response = client.post("/api/users", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def create_group(client: TestClient, payload: dict) -> dict:
    response = client.post("/api/groups", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def create_transaction(client: TestClient, payload: dict) -> dict:
    response = client.post("/api/transactions", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def score_transaction(client: TestClient, transaction_id: int) -> dict:
    response = client.post(f"/api/transactions/{transaction_id}/score")
    assert response.status_code == 201, response.text
    return response.json()


def create_high_risk_transaction(client: TestClient) -> dict:
    user = create_user(
        client,
        {
            "external_id": "high-risk-user",
            "full_name": "High Risk User",
            "account_age_days": 5,
            "contribution_count": 0,
            "failed_transaction_count": 3,
            "successful_repayment_count": 0,
            "reputation_score": 25,
        },
    )
    group = create_group(
        client,
        {
            "external_id": "risky-group",
            "name": "Risky Group",
            "member_count": 12,
            "default_rate": "0.2000",
            "suspicious_activity_count": 2,
        },
    )
    return create_transaction(
        client,
        {
            "user_id": user["id"],
            "group_id": group["id"],
            "transaction_type": "FUNDING_REQUEST",
            "amount": "2500.00",
            "currency": "USD",
            "status": "PENDING",
        },
    )


def test_low_risk_api_flow_creates_no_alert_or_review_case(client: TestClient) -> None:
    user = create_user(
        client,
        {
            "external_id": "low-risk-user",
            "full_name": "Low Risk User",
            "account_age_days": 180,
            "contribution_count": 12,
            "failed_transaction_count": 0,
            "successful_repayment_count": 6,
            "reputation_score": 90,
        },
    )
    group = create_group(
        client,
        {
            "external_id": "stable-group",
            "name": "Stable Group",
            "member_count": 25,
            "default_rate": "0.0200",
            "suspicious_activity_count": 0,
        },
    )
    transaction = create_transaction(
        client,
        {
            "user_id": user["id"],
            "group_id": group["id"],
            "transaction_type": "CONTRIBUTION",
            "amount": "50.00",
            "currency": "USD",
            "status": "PENDING",
        },
    )

    risk_score = score_transaction(client, transaction["id"])

    assert risk_score["level"] == "LOW"
    assert risk_score["recommendation"] == "APPROVE"
    assert client.get("/api/alerts").json() == []
    assert client.get("/api/review-cases").json() == []


def test_medium_risk_api_flow_creates_review_case(client: TestClient) -> None:
    user = create_user(
        client,
        {
            "external_id": "medium-risk-user",
            "full_name": "Medium Risk User",
            "account_age_days": 10,
            "contribution_count": 1,
            "failed_transaction_count": 0,
            "successful_repayment_count": 0,
            "reputation_score": 70,
        },
    )
    group = create_group(
        client,
        {
            "external_id": "medium-stable-group",
            "name": "Medium Stable Group",
            "member_count": 18,
            "default_rate": "0.0500",
            "suspicious_activity_count": 0,
        },
    )
    transaction = create_transaction(
        client,
        {
            "user_id": user["id"],
            "group_id": group["id"],
            "transaction_type": "FUNDING_REQUEST",
            "amount": "250.00",
            "currency": "USD",
            "status": "PENDING",
        },
    )

    risk_score = score_transaction(client, transaction["id"])
    review_cases = client.get("/api/review-cases").json()

    assert risk_score["level"] == "MEDIUM"
    assert risk_score["recommendation"] == "REVIEW"
    assert len(review_cases) == 1
    assert review_cases[0]["risk_score_id"] == risk_score["id"]


def test_high_risk_api_flow_creates_alert_and_review_case(client: TestClient) -> None:
    transaction = create_high_risk_transaction(client)

    risk_score = score_transaction(client, transaction["id"])
    alerts = client.get("/api/alerts").json()
    review_cases = client.get("/api/review-cases").json()

    assert risk_score["level"] == "HIGH"
    assert risk_score["recommendation"] == "BLOCK"
    assert len(alerts) == 1
    assert alerts[0]["risk_score_id"] == risk_score["id"]
    assert len(review_cases) == 1
    assert review_cases[0]["risk_score_id"] == risk_score["id"]


def test_alert_and_review_workflow_updates_statuses(client: TestClient) -> None:
    transaction = create_high_risk_transaction(client)
    score_transaction(client, transaction["id"])
    alert = client.get("/api/alerts").json()[0]
    review_case = client.get("/api/review-cases").json()[0]

    resolved_alert = client.post(
        f"/api/alerts/{alert['id']}/resolve",
        json={"analystNote": "Confirmed as investigated."},
    )
    rejected_case = client.post(
        f"/api/review-cases/{review_case['id']}/reject",
        json={"analystNote": "Rejected after analyst review."},
    )

    assert resolved_alert.status_code == 200, resolved_alert.text
    assert resolved_alert.json()["status"] == "RESOLVED"
    assert rejected_case.status_code == 200, rejected_case.text
    assert rejected_case.json()["status"] == "REJECTED"
    assert rejected_case.json()["analyst_note"] == "Rejected after analyst review."
