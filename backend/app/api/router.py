from fastapi import APIRouter

from app.api.routes import alerts, groups, health, review_cases, transactions, trust_edges, users

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(users.router)
api_router.include_router(groups.router)
api_router.include_router(transactions.router)
api_router.include_router(alerts.router)
api_router.include_router(review_cases.router)
api_router.include_router(trust_edges.router)
