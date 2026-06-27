from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.api.deps import DbSession
from app.models.entities import GroupProfile
from app.schemas.domain import GroupProfileCreate, GroupProfileRead, RiskScoreRead
from app.services.risk import RiskScoringService

router = APIRouter(prefix="/groups", tags=["groups"])


@router.post("", response_model=GroupProfileRead, status_code=201)
def create_group(payload: GroupProfileCreate, db: DbSession) -> GroupProfile:
    group = GroupProfile(**payload.model_dump())
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.get("", response_model=list[GroupProfileRead])
def list_groups(db: DbSession) -> list[GroupProfile]:
    return list(db.scalars(select(GroupProfile).order_by(GroupProfile.created_at.desc())))


@router.get("/{group_id}", response_model=GroupProfileRead)
def get_group(group_id: int, db: DbSession) -> GroupProfile:
    group = db.get(GroupProfile, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.get("/{group_id}/risk", response_model=RiskScoreRead)
def get_group_risk(group_id: int, db: DbSession):
    risk_score = RiskScoringService(db).latest_group_risk(group_id)
    if risk_score is None:
        raise HTTPException(status_code=404, detail="No risk score found for group")
    return risk_score
