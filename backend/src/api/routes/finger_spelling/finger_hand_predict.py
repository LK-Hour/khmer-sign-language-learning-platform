"""Hand prediction endpoints for finger-spelling practice."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from src.api.deps import get_current_user
from src.models.user import User
from src.schemas.finger_spelling import (
    HandPredictFeaturesRequest,
    HandPredictResponse,
    HandPredictStatusResponse,
)
from src.services.finger_spelling.hand_prediction_service import (
    get_hand_prediction_service,
)

router = APIRouter()


@router.get("/predict/status", response_model=HandPredictStatusResponse)
def hand_predict_status(
    _user: User = Depends(get_current_user),
) -> HandPredictStatusResponse:
    service = get_hand_prediction_service()
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
    _user: User = Depends(get_current_user),
) -> HandPredictResponse:
    service = get_hand_prediction_service()
    if not service.is_available:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Hand prediction model is not configured",
        )

    try:
        result = service.predict_from_features(
            body.features,
            handedness=body.handedness or "Unknown",
        )
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
        match_confidence=result.match_confidence,
        predicted_class_index=result.prediction.predicted_class_index,
        predicted_label=result.prediction.predicted_label,
        handedness=result.features.handedness,
    )
