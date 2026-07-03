"""Word prediction endpoints for word-detection practice."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status

from src.api.deps import get_optional_user
from src.models.user import User
from src.schemas.word_detection import (
    WordPredictFeaturesRequest,
    WordPredictResponse,
    WordPredictStatusResponse,
)

router = APIRouter()
GUEST_ID_HEADER = "X-KSL-Guest-Id"


def _require_user_or_guest(user: User | None, guest_id: str | None) -> None:
    if user is not None:
        return
    if guest_id and guest_id.startswith("guest_"):
        return
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")


def _get_word_prediction_service():
    try:
        from src.services.word_detection.word_prediction_service import (
            get_word_prediction_service,
        )
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Word prediction service is unavailable: {exc}",
        ) from exc

    return get_word_prediction_service()


def _get_word_label_match_prediction_service():
    try:
        from src.services.word_detection.word_prediction_service_label_match import (
            get_word_label_match_prediction_service,
        )
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Word label-match prediction service is unavailable: {exc}",
        ) from exc

    return get_word_label_match_prediction_service()


@router.get("/predict/status", response_model=WordPredictStatusResponse)
def word_predict_status(
    user: User | None = Depends(get_optional_user),
    guest_id: str | None = Header(default=None, alias=GUEST_ID_HEADER),
) -> WordPredictStatusResponse:
    _require_user_or_guest(user, guest_id)
    service = _get_word_prediction_service()
    model_ready = service.is_available
    metadata = service.get_metadata() if model_ready else {}
    label_count = int(metadata.get("label_count") or 0)
    output_class_count = metadata.get("output_class_count")
    return WordPredictStatusResponse(
        available=model_ready,
        model_loaded=model_ready,
        label_map_loaded=bool(label_count),
        label_count=label_count,
        output_class_count=output_class_count,
        input_feature_count=metadata.get("input_feature_count"),
        label_map_matches_model=bool(label_count and output_class_count == label_count),
    )


@router.post("/predict/features", response_model=WordPredictResponse)
def predict_from_features(
    body: WordPredictFeaturesRequest,
    user: User | None = Depends(get_optional_user),
    guest_id: str | None = Header(default=None, alias=GUEST_ID_HEADER),
) -> WordPredictResponse:
    _require_user_or_guest(user, guest_id)
    service = (
        _get_word_label_match_prediction_service()
        if body.target_label
        else _get_word_prediction_service()
    )
    if not service.is_available:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=service.unavailable_reason or "Word prediction model is not configured",
        )

    try:
        if body.target_label:
            result = service.predict_from_features_with_target(
                body.features,
                target_label=body.target_label,
            )
            base_result = result.base
            label_match = result.label_match
        else:
            base_result = service.predict_from_features(body.features)
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

    return WordPredictResponse(
        match_confidence=base_result.match_confidence,
        predicted_class_index=base_result.prediction.predicted_class_index,
        predicted_label=base_result.prediction.predicted_label,
        probabilities=base_result.prediction.probabilities,
        target_label=label_match.target_label if label_match else None,
        label_matches=label_match.label_matches if label_match else None,
    )
