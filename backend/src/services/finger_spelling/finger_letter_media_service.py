"""Resolves finger-letter reference images for arbitrary Khmer characters.

Unlike the chapter-practice flow (which resolves images per lesson/chapter),
this looks a character up directly by ``letter_kh`` — used by other tracks
(e.g. sentence-spelling) that need a reference sign image for whichever
character is currently being practiced.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from src.repositories.finger_spelling.finger_curriculum_repository import (
    FingerCurriculumRepository,
)
from src.services.finger_spelling.finger_practice_image_service import (
    media_file_url_to_serve_url,
    resolve_practice_image_url,
)

_PLACEHOLDER_IMAGE = "/finger-spelling/placeholder-sign.svg"


class FingerLetterMediaService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.curriculum = FingerCurriculumRepository(db)

    def resolve_media_for_letters(self, letters_kh: list[str]) -> dict[str, str]:
        """Return {letter_kh: image_url} for every unique character given.

        Looks up seeded ``finger_letter_medias``/``medias`` rows first, then
        falls back to the filesystem-based practice dataset, then to the
        shared placeholder image.
        """
        unique = list(dict.fromkeys(letters_kh))
        if not unique:
            return {}

        letters = {ch: self.curriculum.get_letter_by_kh(ch) for ch in unique}
        letter_ids = [letter.id for letter in letters.values() if letter is not None]
        medias_by_id = self.curriculum.list_medias_for_letters(letter_ids)

        result: dict[str, str] = {}
        for ch, letter in letters.items():
            medias = medias_by_id.get(letter.id, []) if letter is not None else []
            image_url = media_file_url_to_serve_url(medias[0].file_url) if medias else None
            if image_url is None:
                image_url = resolve_practice_image_url(ch)
            result[ch] = image_url or _PLACEHOLDER_IMAGE
        return result
