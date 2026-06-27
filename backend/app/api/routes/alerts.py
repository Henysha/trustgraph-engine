from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.api.deps import DbSession
from app.models.entities import FraudAlert
from app.models.enums import AlertStatus
from app.schemas.domain import FraudAlertRead, ResolutionRequest

router = APIRouter(prefix="/alerts", tags=["fraud-alerts"])


@router.get("", response_model=list[FraudAlertRead])
def list_alerts(db: DbSession) -> list[FraudAlert]:
    return list(db.scalars(select(FraudAlert).order_by(FraudAlert.created_at.desc())))


@router.get("/{alert_id}", response_model=FraudAlertRead)
def get_alert(alert_id: int, db: DbSession) -> FraudAlert:
    alert = db.get(FraudAlert, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.post("/{alert_id}/resolve", response_model=FraudAlertRead)
def resolve_alert(alert_id: int, payload: ResolutionRequest, db: DbSession) -> FraudAlert:
    alert = db.get(FraudAlert, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = AlertStatus.RESOLVED
    if payload.analyst_note:
        alert.reason = f"{alert.reason}\nResolution: {payload.analyst_note}"
    db.commit()
    db.refresh(alert)
    return alert
