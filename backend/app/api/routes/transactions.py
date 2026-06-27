from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.api.deps import DbSession
from app.models.entities import GroupProfile, TransactionEvent, UserProfile
from app.schemas.domain import RiskScoreRead, TransactionEventCreate, TransactionEventRead
from app.services.risk import RiskScoringService

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("", response_model=TransactionEventRead, status_code=201)
def create_transaction(payload: TransactionEventCreate, db: DbSession) -> TransactionEvent:
    if db.get(UserProfile, payload.user_id) is None:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.group_id and db.get(GroupProfile, payload.group_id) is None:
        raise HTTPException(status_code=404, detail="Group not found")

    transaction = TransactionEvent(**payload.model_dump())
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.get("", response_model=list[TransactionEventRead])
def list_transactions(db: DbSession) -> list[TransactionEvent]:
    return list(db.scalars(select(TransactionEvent).order_by(TransactionEvent.created_at.desc())))


@router.get("/{transaction_id}", response_model=TransactionEventRead)
def get_transaction(transaction_id: int, db: DbSession) -> TransactionEvent:
    transaction = db.get(TransactionEvent, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.post("/{transaction_id}/score", response_model=RiskScoreRead, status_code=201)
def score_transaction(transaction_id: int, db: DbSession):
    try:
        return RiskScoringService(db).score_transaction(transaction_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
