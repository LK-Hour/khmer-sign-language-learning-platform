"""WebSocket endpoint for real-time word prediction."""

from __future__ import annotations

import json
import logging
import uuid

from fastapi import WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, ValidationError

from src.db.session import SessionLocal
from src.ml.word_predictor import WORD_FEATURE_COUNT
from src.models.user import User
from src.services.word_detection.word_prediction_service import (
    get_word_prediction_service,
)
from src.utils.jwt_utils import verify_token

logger = logging.getLogger(__name__)


class AuthMessage(BaseModel):
    type: str = "auth"
    guestId: str | None = None
    token: str | None = None


class PredictMessage(BaseModel):
    type: str = "predict"
    features: list[float]


class WsPredictResponse(BaseModel):
    type: str = "prediction"
    label: str | None
    confidence: float
    classIndex: int


class WsErrorResponse(BaseModel):
    type: str = "error"
    message: str


def _authenticate_token(token: str) -> str | None:
    try:
        payload = verify_token(token)
    except Exception:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    try:
        uid = uuid.UUID(str(user_id))
    except ValueError:
        return None

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == uid, User.is_active.is_(True)).first()
        return str(user.id) if user else None
    finally:
        db.close()


async def handle_websocket(websocket: WebSocket) -> None:
    await websocket.accept()

    service = get_word_prediction_service()
    if not service.is_available:
        await websocket.send_json(
            WsErrorResponse(
                message=service.unavailable_reason
                or "Word prediction model is not configured"
            ).model_dump()
        )
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        return

    authenticated = False
    subject_id: str | None = None

    try:
        while True:
            raw = await websocket.receive_text()

            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json(WsErrorResponse(message="Invalid JSON").model_dump())
                continue

            msg_type = data.get("type", "")

            if msg_type == "auth":
                try:
                    auth = AuthMessage(**data)
                except ValidationError as exc:
                    await websocket.send_json(
                        WsErrorResponse(message=f"Invalid auth message: {exc}").model_dump()
                    )
                    continue

                if auth.guestId and auth.guestId.startswith("guest_"):
                    authenticated = True
                    subject_id = auth.guestId
                    await websocket.send_json({"type": "auth_ok"})
                elif auth.token:
                    user_id = _authenticate_token(auth.token)
                    if not user_id:
                        await websocket.send_json(
                            WsErrorResponse(message="Authentication required").model_dump()
                        )
                        continue
                    authenticated = True
                    subject_id = user_id
                    await websocket.send_json({"type": "auth_ok"})
                else:
                    await websocket.send_json(
                        WsErrorResponse(message="Authentication required").model_dump()
                    )
                    continue

            elif msg_type == "predict":
                if not authenticated:
                    await websocket.send_json(
                        WsErrorResponse(message="Send auth message first").model_dump()
                    )
                    continue

                try:
                    pred_msg = PredictMessage(**data)
                except ValidationError as exc:
                    await websocket.send_json(
                        WsErrorResponse(message=f"Invalid predict message: {exc}").model_dump()
                    )
                    continue

                if len(pred_msg.features) != WORD_FEATURE_COUNT:
                    await websocket.send_json(
                        WsErrorResponse(
                            message=f"Expected {WORD_FEATURE_COUNT} features, got {len(pred_msg.features)}"
                        ).model_dump()
                    )
                    continue

                try:
                    result = service.predict_from_features(pred_msg.features)
                except Exception as exc:
                    logger.exception("Word prediction failed")
                    await websocket.send_json(WsErrorResponse(message=str(exc)).model_dump())
                    continue

                await websocket.send_json(
                    WsPredictResponse(
                        label=result.prediction.predicted_label,
                        confidence=result.match_confidence,
                        classIndex=result.prediction.predicted_class_index,
                    ).model_dump()
                )

            else:
                await websocket.send_json(
                    WsErrorResponse(message=f"Unknown message type: {msg_type}").model_dump()
                )

    except WebSocketDisconnect:
        logger.info("Word prediction WebSocket disconnected (subject=%s)", subject_id)
    except Exception:
        logger.exception("Unexpected word prediction WebSocket error")
