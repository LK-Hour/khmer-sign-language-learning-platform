"""Hand prediction endpoints for sentence-spelling practice (REST fallback; the
frontend camera panel primarily uses the WebSocket endpoint in
``sentence_hand_predict_ws.py`` for real-time streaming)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status

from src.api.deps import get_optional_user
from src.models.user import User
from src.schemas.sentence_spelling import (
    HandPredictFeaturesRequest,
    HandPredictResponse,
    HandPredictStatusResponse,
)

router = APIRouter(prefix="/api/sentence_spelling", tags=["sentence-spelling-predict"])
GUEST_ID_HEADER = "X-KSL-Guest-Id"


def _require_user_or_guest(user: User | None, guest_id: str | None) -> None:
    if user is not None:
        return
    if guest_id and guest_id.startswith("guest_"):
        return
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")


def _get_prediction_service():
    from src.services.sentence_spelling import get_sentence_hand_prediction_service

    return get_sentence_hand_prediction_service()


def _get_label_match_service():
    from src.services.sentence_spelling import get_sentence_hand_label_match_prediction_service

    return get_sentence_hand_label_match_prediction_service()


@router.get("/predict/status", response_model=HandPredictStatusResponse)
def sentence_predict_status(
    user: User | None = Depends(get_optional_user),
    guest_id: str | None = Header(default=None, alias=GUEST_ID_HEADER),
) -> HandPredictStatusResponse:
    _require_user_or_guest(user, guest_id)
    service = _get_prediction_service()
    model_ready = service.is_available
    metadata = service.get_metadata() if model_ready else {}
    return HandPredictStatusResponse(
        available=model_ready,
        model_loaded=model_ready,
        label_count=int(metadata.get("label_count") or 0),
        output_class_count=metadata.get("output_class_count"),
    )


@router.post("/predict/features", response_model=HandPredictResponse)
def sentence_predict_from_features(
    body: HandPredictFeaturesRequest,
    user: User | None = Depends(get_optional_user),
    guest_id: str | None = Header(default=None, alias=GUEST_ID_HEADER),
) -> HandPredictResponse:
    _require_user_or_guest(user, guest_id)
    service = _get_label_match_service() if body.target_label else _get_prediction_service()
    if not service.is_available:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Sentence hand prediction model is not configured",
        )

    try:
        if body.target_label:
            result = service.predict_from_features_with_target(
                body.features,
                handedness=body.handedness or "Unknown",
                target_label=body.target_label,
            )
            base_result = result.base
            label_match = result.label_match
        else:
            base_result = service.predict_from_features(
                body.features,
                handedness=body.handedness or "Unknown",
            )
            label_match = None
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {exc}",
        ) from exc

    return HandPredictResponse(
        match_confidence=base_result.match_confidence,
        predicted_class_index=base_result.prediction.predicted_class_index,
        predicted_label=base_result.prediction.predicted_label,
        handedness=base_result.features.handedness,
        target_label=label_match.target_label if label_match else None,
        label_matches=label_match.label_matches if label_match else None,
    )
