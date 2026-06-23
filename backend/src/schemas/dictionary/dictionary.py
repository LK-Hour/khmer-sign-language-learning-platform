from pydantic import BaseModel


class DictionaryEntryResponse(BaseModel):
    id: int
    text_en: str
    text_kh: str
    media_url: str | None = None
    video_url: str | None = None
    category: str | None = None
    entry_type: str = "character"
    description: str | None = None
    lesson_id: int | None = None


class DictionaryListResponse(BaseModel):
    items: list[DictionaryEntryResponse]
    total: int
    page: int = 1
    page_size: int = 10
    character_count: int = 0
    word_count: int = 0
