from __future__ import annotations

from datetime import datetime
from typing import Any

import httpx

API_BASE_URL = "http://localhost:8000/api"


def post(client: httpx.Client, path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    response = client.post(path, json=payload)
    response.raise_for_status()
    return response.json()


def get(client: httpx.Client, path: str) -> list[dict[str, Any]] | dict[str, Any]:
    response = client.get(path)
    response.raise_for_status()
    return response.json()


def create_user(client: httpx.Client, suffix: str, *, high_risk: bool) -> dict[str, Any]:
    if high_risk:
        payload = {
            "external_id": f"demo-high-risk-user-{suffix}",
            "full_name": "Demo High Risk User",
            "email": f"high-risk-{suffix}@example.com",
            "account_age_days": 4,
            "contribution_count": 0,
            "failed_transaction_count": 3,
            "successful_repayment_count": 0,
            "reputation_score": 25,
        }
    else:
        payload = {
            "external_id": f"demo-low-risk-user-{suffix}",
            "full_name": "Demo Low Risk User",
            "email": f"low-risk-{suffix}@example.com",
            "account_age_days": 240,
            "contribution_count": 14,
            "failed_transaction_count": 0,
            "successful_repayment_count": 7,
            "reputation_score": 92,
        }
    return post(client, "/users", payload)


def create_group(client: httpx.Client, suffix: str, *, risky: bool) -> dict[str, Any]:
    if risky:
        payload = {
            "external_id": f"demo-risky-group-{suffix}",
            "name": "Demo Risky Lending Circle",
            "member_count": 9,
            "default_rate": "0.2200",
            "suspicious_activity_count": 3,
        }
    else:
        payload = {
            "external_id": f"demo-stable-group-{suffix}",
            "name": "Demo Stable Savings Group",
            "member_count": 32,
            "default_rate": "0.0200",
            "suspicious_activity_count": 0,
        }
    return post(client, "/groups", payload)


def create_transaction(
    client: httpx.Client,
    *,
    user_id: int,
    group_id: int,
    transaction_type: str,
    amount: str,
) -> dict[str, Any]:
    return post(
        client,
        "/transactions",
        {
            "user_id": user_id,
            "group_id": group_id,
            "transaction_type": transaction_type,
            "amount": amount,
            "currency": "USD",
            "status": "PENDING",
        },
    )


def print_score(title: str, score: dict[str, Any]) -> None:
    print(f"\n{title}")
    print("-" * len(title))
    print(f"Score:          {score['score']}")
    print(f"Level:          {score['level']}")
    print(f"Recommendation: {score['recommendation']}")
    print("Reasons:")
    for reason in score["reasons"]:
        print(f"  - {reason}")


def main() -> None:
    suffix = datetime.utcnow().strftime("%Y%m%d%H%M%S")

    print("\nTrustGraph Engine Demo Flow")
    print("===========================")
    print(f"API: {API_BASE_URL}")

    with httpx.Client(base_url=API_BASE_URL, timeout=10.0) as client:
        health = get(client, "/health")
        print(f"Health check: {health['status']}")

        low_risk_user = create_user(client, suffix, high_risk=False)
        high_risk_user = create_user(client, suffix, high_risk=True)
        stable_group = create_group(client, suffix, risky=False)
        risky_group = create_group(client, suffix, risky=True)

        print("\nCreated demo subjects")
        print("---------------------")
        print(f"Low-risk user:  #{low_risk_user['id']} {low_risk_user['full_name']}")
        print(f"High-risk user: #{high_risk_user['id']} {high_risk_user['full_name']}")
        print(f"Stable group:   #{stable_group['id']} {stable_group['name']}")
        print(f"Risky group:    #{risky_group['id']} {risky_group['name']}")

        low_risk_transaction = create_transaction(
            client,
            user_id=low_risk_user["id"],
            group_id=stable_group["id"],
            transaction_type="CONTRIBUTION",
            amount="50.00",
        )
        low_risk_score = post(client, f"/transactions/{low_risk_transaction['id']}/score")
        print_score("Low-Risk Contribution Result", low_risk_score)

        high_risk_transaction = create_transaction(
            client,
            user_id=high_risk_user["id"],
            group_id=risky_group["id"],
            transaction_type="FUNDING_REQUEST",
            amount="2500.00",
        )
        high_risk_score = post(client, f"/transactions/{high_risk_transaction['id']}/score")
        print_score("High-Risk Funding Request Result", high_risk_score)

        alerts = get(client, "/alerts")
        review_cases = get(client, "/review-cases")

        print("\nFraud Alerts")
        print("------------")
        if alerts:
            for alert in alerts:
                print(
                    f"Alert #{alert['id']} | status={alert['status']} | "
                    f"severity={alert['severity']} | transaction={alert['transaction_id']}"
                )
        else:
            print("No fraud alerts found.")

        print("\nReview Cases")
        print("------------")
        if review_cases:
            for case in review_cases:
                print(
                    f"Case #{case['id']} | status={case['status']} | "
                    f"transaction={case['transaction_id']}"
                )
        else:
            print("No review cases found.")

        print("\nDemo Summary")
        print("------------")
        print(
            "Low-risk contribution was "
            f"{low_risk_score['recommendation']} with {low_risk_score['level']} risk."
        )
        print(
            "High-risk funding request was "
            f"{high_risk_score['recommendation']} with {high_risk_score['level']} risk."
        )
        print(f"Open operational items: {len(alerts)} alerts, {len(review_cases)} review cases.")


if __name__ == "__main__":
    main()
