from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.api.deps import DbSession
from app.models.entities import TrustSignal, UserProfile
from app.schemas.domain import RiskScoreRead, TrustSignalCreate, TrustSignalRead, UserProfileCreate, UserProfileRead
from app.services.risk import RiskScoringService

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserProfileRead, status_code=201)
def create_user(payload: UserProfileCreate, db: DbSession) -> UserProfile:
    user = UserProfile(**payload.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("", response_model=list[UserProfileRead])
def list_users(db: DbSession) -> list[UserProfile]:
    return list(db.scalars(select(UserProfile).order_by(UserProfile.created_at.desc())))


@router.get("/{user_id}", response_model=UserProfileRead)
def get_user(user_id: int, db: DbSession) -> UserProfile:
    user = db.get(UserProfile, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}/risk", response_model=RiskScoreRead)
def get_user_risk(user_id: int, db: DbSession):
    risk_score = RiskScoringService(db).latest_user_risk(user_id)
    if risk_score is None:
        raise HTTPException(status_code=404, detail="No risk score found for user")
    return risk_score


@router.post("/{user_id}/signals", response_model=TrustSignalRead, status_code=201)
def create_user_signal(user_id: int, payload: TrustSignalCreate, db: DbSession) -> TrustSignal:
    if db.get(UserProfile, user_id) is None:
        raise HTTPException(status_code=404, detail="User not found")

    signal = TrustSignal(user_id=user_id, **payload.model_dump())
    db.add(signal)
    db.commit()
    db.refresh(signal)
    return signal


@router.get("/{user_id}/signals", response_model=list[TrustSignalRead])
def list_user_signals(user_id: int, db: DbSession) -> list[TrustSignal]:
    return list(db.scalars(select(TrustSignal).where(TrustSignal.user_id == user_id)))
