"""Resolves a Khmer letter (letter_kh) to its practice glyph image URL.

The practice dataset lives under data_set/finger_spelling_practice/ in the
repo root and is served as static files at /data_set/... by FastAPI (see
src/main.py).  This service builds a cached index of all image files in that
tree so that look-ups are O(1) after the first call.

Folder layout (nested per-letter sub-folders):
    finger_spelling_practice/
        main consanants/<letter>/<letter>.png
        sub consanants/sub_<base>/<sub_<base>>.png
        vowels/<vowel>/<vowel>.png
        independent vowels/<folder>/<filename>.png
        diacritice/<letter>/<letter>.png   (note: intentional typo in folder name)
        number/<digit>/<digit>.png
"""

from __future__ import annotations

import os
import threading
from functools import lru_cache
from pathlib import Path

from src.core.khmer_letter_aliases import (
    COENG_PREFIX,
    INDEPENDENT_VOWEL_STEM_TO_LETTER,
    LETTER_TO_DIACRITIC_STEM,
    SUB_CONSONANT_FOLDER_PREFIX,
)

# ---------------------------------------------------------------------------
# Repo-root discovery
# ---------------------------------------------------------------------------

# backend/src/services/finger_spelling/finger_practice_image_service.py
# parents: [.../finger_spelling, .../services, .../src, .../backend, repo_root]
_THIS_FILE = Path(__file__).resolve()
_REPO_ROOT = _THIS_FILE.parents[4]

# The dataset folder may be named "finger_spelling_practice" or similar
_PRACTICE_DATASET_PREFIX = "finger_spelling_practice"


def _find_practice_dataset_root() -> Path | None:
    """Locate the practice image dataset under the repo root."""
    data_set_dir = _REPO_ROOT / "data_set"
    if not data_set_dir.is_dir():
        return None
    for child in sorted(data_set_dir.iterdir()):
        if child.is_dir() and child.name.startswith(_PRACTICE_DATASET_PREFIX):
            return child
    return None


# ---------------------------------------------------------------------------
# Index builder
# ---------------------------------------------------------------------------

_INDEX_LOCK = threading.Lock()
_index_cache: dict[str, str] | None = None  # stem → "/data_set/..." URL


def _build_index() -> dict[str, str]:
    """Walk the practice dataset tree and build a stem → URL map."""
    root = _find_practice_dataset_root()
    if root is None:
        return {}

    index: dict[str, str] = {}
    image_exts = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
    data_set_dir = _REPO_ROOT / "data_set"

    for dirpath, _, filenames in os.walk(root):
        for fname in filenames:
            ext = Path(fname).suffix.lower()
            if ext not in image_exts:
                continue
            stem = Path(fname).stem
            abs_path = Path(dirpath) / fname
            # Compute URL relative to the data_set folder (as mounted in main.py)
            try:
                rel = abs_path.relative_to(data_set_dir)
            except ValueError:
                continue
            url = "/data_set/" + rel.as_posix()
            # Store by stem; later stems overwrite earlier ones (there should
            # be at most one image per letter, so collisions are acceptable)
            index[stem] = url

    return index


def _get_index() -> dict[str, str]:
    global _index_cache
    if _index_cache is not None:
        return _index_cache
    with _INDEX_LOCK:
        if _index_cache is None:
            _index_cache = _build_index()
    return _index_cache


def invalidate_index() -> None:
    """Force a rebuild on the next look-up (useful after dataset updates)."""
    global _index_cache
    with _INDEX_LOCK:
        _index_cache = None


# ---------------------------------------------------------------------------
# Public resolver
# ---------------------------------------------------------------------------

def resolve_practice_image_url(letter_kh: str) -> str | None:
    """Return the /data_set/... URL for the practice glyph of *letter_kh*.

    Returns ``None`` when no image can be found for this letter.

    Resolution order:
    1. Direct stem match (works for main consonants, vowels, numbers, diacritics
       whose folder/filename equals the letter exactly).
    2. Sub-consonant: strip the leading coeng (្) prefix and prepend "sub_".
    3. Independent-vowel alias look-up (ឣ → "independent_អ" or "អ", ឤ → "អា").
    4. Diacritic alias look-up ("?" → "question", "!" → "!").
    """
    index = _get_index()

    # 1. Direct match
    if letter_kh in index:
        return index[letter_kh]

    # 2. Sub-consonant: DB stores e.g. "្ក"; dataset uses "sub_ក"
    if letter_kh.startswith(COENG_PREFIX):
        base = letter_kh[len(COENG_PREFIX):]
        sub_stem = f"{SUB_CONSONANT_FOLDER_PREFIX}{base}"
        if sub_stem in index:
            return index[sub_stem]

    # 3. Independent vowel alias
    diacritic_stem = LETTER_TO_DIACRITIC_STEM.get(letter_kh)
    if diacritic_stem and diacritic_stem in index:
        return index[diacritic_stem]

    # 4. Walk all known independent-vowel stems and check
    for stem, mapped_letter in INDEPENDENT_VOWEL_STEM_TO_LETTER.items():
        if mapped_letter == letter_kh and stem in index:
            return index[stem]

    return None


def media_file_url_to_serve_url(file_url: str) -> str:
    """Convert a stored media file_url to a /data_set/... browser URL."""
    normalized = file_url.replace("\\", "/").lstrip("./")
    if normalized.startswith("/data_set/"):
        return normalized
    if normalized.startswith("data_set/"):
        return "/" + normalized
    if "data_set/" in normalized:
        idx = normalized.index("data_set/")
        return "/" + normalized[idx:]
    return "/data_set/" + normalized


def _build_stem_index_from_medias(medias) -> dict[str, str]:
    """Build filename-stem → serve URL from seeded Media rows."""
    index: dict[str, str] = {}
    for media in medias:
        file_url = getattr(media, "file_url", None)
        if not file_url:
            continue
        stem = Path(file_url).stem
        index[stem] = media_file_url_to_serve_url(file_url)
    return index


def resolve_practice_image_url_from_medias(letter_kh: str, medias) -> str | None:
    """Resolve practice glyph URL from seeded finger_practice_medias rows."""
    if not medias:
        return None
    index = _build_stem_index_from_medias(medias)

    if letter_kh in index:
        return index[letter_kh]

    if letter_kh.startswith(COENG_PREFIX):
        base = letter_kh[len(COENG_PREFIX):]
        sub_stem = f"{SUB_CONSONANT_FOLDER_PREFIX}{base}"
        if sub_stem in index:
            return index[sub_stem]

    diacritic_stem = LETTER_TO_DIACRITIC_STEM.get(letter_kh)
    if diacritic_stem and diacritic_stem in index:
        return index[diacritic_stem]

    for stem, mapped_letter in INDEPENDENT_VOWEL_STEM_TO_LETTER.items():
        if mapped_letter == letter_kh and stem in index:
            return index[stem]

    return None
