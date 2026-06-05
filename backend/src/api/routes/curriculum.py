"""Letter lookup endpoints (``/api/curriculum/letters/...``).

Not the finger-spelling course tree; units/chapters/lessons live under
``/api/finger_spelling/*`` (see ``api.routes.finger_spelling.finger_curriculum``).
"""

from __future__ import annotations

from html import escape

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from src.api.deps import get_db
from src.schemas.finger_spelling import (
    ChapterResponse,
    LetterDataResponse,
    LetterMediaListResponse,
    LetterResponse,
    LessonPathItem,
    LessonResponse,
    UnitChapterPair,
    UnitResponse,
)
from src.schemas.media import MediaResponse
from src.services.finger_spelling.finger_curriculum_service import FingerCurriculumService

router = APIRouter(prefix="/api/curriculum", tags=["curriculum"])


def _to_preview_src(file_url: str) -> str:
    if file_url.startswith(("http://", "https://", "/")):
        return file_url

    normalized = file_url.replace("\\", "/").lstrip("./")
    return f"/{normalized}"


def _build_letter_data_response(service: FingerCurriculumService, letter_kh: str) -> LetterDataResponse:
    bundle = service.get_letter_data_by_kh(letter_kh)
    if bundle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Letter not found")

    letter = bundle.letter
    medias = [MediaResponse.model_validate(m) for m in bundle.medias]
    letter_resp = LetterResponse(
        id=letter.id,
        letter_kh=letter.letter_kh,
        letter_en=letter.letter_en,
        description_en=letter.description_en,
        description_kh=letter.description_kh,
        is_active=letter.is_active,
        created_at=letter.created_at,
        updated_at=letter.updated_at,
        medias=medias,
    )

    lessons = [
        LessonPathItem(
            lesson=LessonResponse.model_validate(path.lesson),
            chapter=ChapterResponse.model_validate(path.chapter),
            unit=UnitResponse.model_validate(path.unit),
        )
        for path in bundle.lesson_paths
    ]

    seen: set[tuple[int, int]] = set()
    units_and_chapters: list[UnitChapterPair] = []
    for path in bundle.lesson_paths:
        key = (path.unit.id, path.chapter.id)
        if key in seen:
            continue
        seen.add(key)
        units_and_chapters.append(
            UnitChapterPair(
                unit=UnitResponse.model_validate(path.unit),
                chapter=ChapterResponse.model_validate(path.chapter),
            )
        )

    return LetterDataResponse(
        letter=letter_resp,
        lessons=lessons,
        units_and_chapters=units_and_chapters,
        medias_count=len(medias),
    )


@router.get("/letters/{letter_kh}", response_model=LetterDataResponse)
def get_letter_data(letter_kh: str, db: Session = Depends(get_db)) -> LetterDataResponse:
    service = FingerCurriculumService(db)
    return _build_letter_data_response(service, letter_kh)


@router.get("/letters/{letter_kh}/medias", response_model=LetterMediaListResponse)
def get_letter_medias(letter_kh: str, db: Session = Depends(get_db)) -> LetterMediaListResponse:
    service = FingerCurriculumService(db)
    bundle = service.get_letter_data_by_kh(letter_kh)
    if bundle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Letter not found")

    medias = [MediaResponse.model_validate(m) for m in bundle.medias]
    return LetterMediaListResponse(
        letter_kh=bundle.letter.letter_kh,
        letter_en=bundle.letter.letter_en,
        total_medias=len(medias),
        medias=medias,
    )


@router.get("/letters/{letter_kh}/images", response_model=LetterMediaListResponse)
def get_letter_images(letter_kh: str, db: Session = Depends(get_db)) -> LetterMediaListResponse:
    service = FingerCurriculumService(db)
    bundle = service.get_letter_data_by_kh(letter_kh)
    if bundle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Letter not found")

    image_medias = [
        MediaResponse.model_validate(media)
        for media in bundle.medias
        if getattr(media.media_type, "value", media.media_type) == "image"
    ]
    return LetterMediaListResponse(
        letter_kh=bundle.letter.letter_kh,
        letter_en=bundle.letter.letter_en,
        total_medias=len(image_medias),
        medias=image_medias,
    )


@router.get("/letters/{letter_kh}/images/preview", response_class=HTMLResponse)
def preview_letter_images(letter_kh: str, db: Session = Depends(get_db)) -> HTMLResponse:
    service = FingerCurriculumService(db)
    bundle = service.get_letter_data_by_kh(letter_kh)
    if bundle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Letter not found")

    image_urls = [
        media.file_url
        for media in bundle.medias
        if getattr(media.media_type, "value", media.media_type) == "image"
    ]

    cards = "".join(
        (
            "<div style='border:1px solid #ddd;border-radius:10px;padding:12px'>"
            f"<img src='{escape(_to_preview_src(url), quote=True)}' alt='letter image {index}' "
            "style='max-width:280px;max-height:280px;object-fit:contain;display:block'>"
            f"<p style='margin:8px 0 0;color:#666;font-size:12px'>Image {index}</p>"
            "</div>"
        )
        for index, url in enumerate(image_urls, start=1)
    )

    if not cards:
        cards = "<p style='color:#666'>No image media found for this letter.</p>"

    letter_en = bundle.letter.letter_en or "-"
    html = (
        "<!doctype html><html><head><meta charset='utf-8'><title>Letter Images Preview</title></head>"
        "<body style='font-family:Arial,sans-serif;padding:24px'>"
        f"<h2 style='margin-top:0'>Letter: {bundle.letter.letter_kh} ({letter_en})</h2>"
        f"<p>Total images: {len(image_urls)}</p>"
        "<div style='display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px'>"
        f"{cards}"
        "</div></body></html>"
    )
    return HTMLResponse(content=html)
