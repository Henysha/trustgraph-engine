from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.api.deps import DbSession
from app.models.entities import ReviewCase
from app.models.enums import ReviewCaseStatus
from app.schemas.domain import ResolutionRequest, ReviewCaseRead

router = APIRouter(prefix="/review-cases", tags=["review-cases"])


@router.get("", response_model=list[ReviewCaseRead])
def list_review_cases(db: DbSession) -> list[ReviewCase]:
    return list(db.scalars(select(ReviewCase).order_by(ReviewCase.created_at.desc())))


@router.get("/{case_id}", response_model=ReviewCaseRead)
def get_review_case(case_id: int, db: DbSession) -> ReviewCase:
    review_case = db.get(ReviewCase, case_id)
    if review_case is None:
        raise HTTPException(status_code=404, detail="Review case not found")
    return review_case


@router.post("/{case_id}/approve", response_model=ReviewCaseRead)
def approve_review_case(case_id: int, payload: ResolutionRequest, db: DbSession) -> ReviewCase:
    return _resolve_case(case_id, ReviewCaseStatus.APPROVED, payload.analyst_note, db)


@router.post("/{case_id}/reject", response_model=ReviewCaseRead)
def reject_review_case(case_id: int, payload: ResolutionRequest, db: DbSession) -> ReviewCase:
    return _resolve_case(case_id, ReviewCaseStatus.REJECTED, payload.analyst_note, db)


def _resolve_case(
    case_id: int,
    status: ReviewCaseStatus,
    notes: str | None,
    db: DbSession,
) -> ReviewCase:
    review_case = db.get(ReviewCase, case_id)
    if review_case is None:
        raise HTTPException(status_code=404, detail="Review case not found")
    review_case.status = status
    review_case.analyst_note = notes
    db.commit()
    db.refresh(review_case)
    return review_case
