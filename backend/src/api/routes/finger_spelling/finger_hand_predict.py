"""Hand prediction endpoints for finger-spelling practice."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status
from src.api.deps import get_optional_user
from src.models.user import User
from src.schemas.finger_spelling import (
    HandPredictFeaturesRequest,
    HandPredictResponse,
    HandPredictStatusResponse,
)

router = APIRouter()
GUEST_ID_HEADER = "X-KSL-Guest-Id"


def _require_user_or_guest(user: User | None, guest_id: str | None) -> None:
    if user is not None:
        return
    if guest_id and guest_id.startswith("guest_"):
        return
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")


def _get_hand_prediction_service():
    try:
        from src.services.finger_spelling.hand_prediction_service import (
            get_hand_prediction_service,
        )
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Hand prediction service is unavailable: {exc}",
        ) from exc

    return get_hand_prediction_service()


def _get_hand_label_match_prediction_service():
    try:
        from src.services.finger_spelling.hand_prediction_service_label_match import (
            get_hand_label_match_prediction_service,
        )
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Hand label-match prediction service is unavailable: {exc}",
        ) from exc

    return get_hand_label_match_prediction_service()


@router.get("/predict/status", response_model=HandPredictStatusResponse)
def hand_predict_status(
    user: User | None = Depends(get_optional_user),
    guest_id: str | None = Header(default=None, alias=GUEST_ID_HEADER),
) -> HandPredictStatusResponse:
    _require_user_or_guest(user, guest_id)
    service = _get_hand_prediction_service()
    model_ready = service.is_available
    metadata = service.get_metadata() if model_ready else {}
    label_count = int(metadata.get("label_count") or 0)
    output_class_count = metadata.get("output_class_count")
    return HandPredictStatusResponse(
        available=model_ready,
        model_loaded=model_ready,
        label_encoder_loaded=bool(label_count),
        label_count=label_count,
        output_class_count=output_class_count,
        label_encoder_matches_model=bool(
            label_count and output_class_count == label_count
        ),
    )


@router.post("/predict/features", response_model=HandPredictResponse)
def predict_from_features(
    body: HandPredictFeaturesRequest,
    user: User | None = Depends(get_optional_user),
    guest_id: str | None = Header(default=None, alias=GUEST_ID_HEADER),
) -> HandPredictResponse:
    _require_user_or_guest(user, guest_id)
    service = (
        _get_hand_label_match_prediction_service()
        if body.target_label
        else _get_hand_prediction_service()
    )
    if not service.is_available:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Hand prediction model is not configured",
        )

    try:
        if body.target_label:
            result = service.predict_from_features_with_target(
                body.features,
                handedness=body.handedness or "Unknown",
                category=body.category,
                target_label=body.target_label,
            )
            base_result = result.base
            label_match = result.label_match
        else:
            base_result = service.predict_from_features(
                body.features,
                handedness=body.handedness or "Unknown",
                category=body.category,
            )
            label_match = None
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
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
