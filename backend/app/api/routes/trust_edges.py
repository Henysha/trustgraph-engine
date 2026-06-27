from fastapi import APIRouter, HTTPException
from sqlalchemy import or_, select

from app.api.deps import DbSession
from app.models.entities import TrustEdge, UserProfile
from app.schemas.domain import NetworkRead, TrustEdgeCreate, TrustEdgeRead

router = APIRouter(tags=["trust-graph"])


@router.post("/trust-edges", response_model=TrustEdgeRead, status_code=201)
def create_trust_edge(payload: TrustEdgeCreate, db: DbSession) -> TrustEdge:
    if db.get(UserProfile, payload.source_user_id) is None:
        raise HTTPException(status_code=404, detail="Source user not found")
    if db.get(UserProfile, payload.target_user_id) is None:
        raise HTTPException(status_code=404, detail="Target user not found")

    edge = TrustEdge(**payload.model_dump())
    db.add(edge)
    db.commit()
    db.refresh(edge)
    return edge


@router.get("/users/{user_id}/network", response_model=NetworkRead)
def get_user_network(user_id: int, db: DbSession) -> NetworkRead:
    if db.get(UserProfile, user_id) is None:
        raise HTTPException(status_code=404, detail="User not found")

    edges = list(
        db.scalars(
            select(TrustEdge).where(
                or_(TrustEdge.source_user_id == user_id, TrustEdge.target_user_id == user_id)
            )
        )
    )
    return NetworkRead(user_id=user_id, edges=edges)
