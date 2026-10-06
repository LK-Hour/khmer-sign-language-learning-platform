"""Shared Khmer letter alias tables.

Used by both the curriculum seed script and the practice image resolver so
there is one canonical source of truth for folder-name → letter_kh mappings.
"""

# Independent vowels: folder/stem name → letter_kh stored in the DB.
# The practice-images dataset uses the display glyph (e.g. "អ") as the
# folder name while the DB stores the deprecated Unicode code-point (ឣ / ឤ).
INDEPENDENT_VOWEL_STEM_TO_LETTER: dict[str, str] = {
    "independent_អ": "ឣ",   # filename stem for ឣ
    "អ": "ឣ",
    "អា": "ឤ",
    "ឥ": "ឥ",
    "ឦ": "ឦ",
    "ឧ": "ឧ",
    "ឩ": "ឩ",
    "ឪ": "ឪ",
    "ឫ": "ឫ",
    "ឬ": "ឬ",
    "ឭ": "ឭ",
    "ឮ": "ឮ",
    "ឯ": "ឯ",
    "ឰ": "ឰ",
    "ឱ": "ឱ",
    "ឳ": "ឳ",
}

# Diacritics: folder/stem name → letter_kh stored in the DB.
DIACRITIC_STEM_TO_LETTER: dict[str, str] = {
    "question": "?",
    "!": "!",
}

# Reverse map: letter_kh → canonical filename stem used in the dataset
LETTER_TO_DIACRITIC_STEM: dict[str, str] = {v: k for k, v in DIACRITIC_STEM_TO_LETTER.items()}

# Coeng (subscript) prefix used in the practice dataset folder names
SUB_CONSONANT_FOLDER_PREFIX = "sub_"
# The leading coeng character in DB letter_kh values for sub-consonants
COENG_PREFIX = "្"
