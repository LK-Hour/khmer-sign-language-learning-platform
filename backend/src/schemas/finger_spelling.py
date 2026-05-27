from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .media import MediaResponse


class UnitBase(BaseModel):
    name_en: str
    name_kh: str
    description_en: Optional[str] = None
    description_kh: Optional[str] = None
    order_index: int = 0
    is_active: bool = True


class UnitResponse(UnitBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ChapterBase(BaseModel):
    unit_id: int
    name_en: str
    name_kh: str
    description_en: Optional[str] = None
    description_kh: Optional[str] = None
    order_index: int = 0
    is_active: bool = True


class ChapterResponse(ChapterBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class LessonBase(BaseModel):
    chapter_id: int
    name_en: str
    name_kh: str
    description_en: Optional[str] = None
    description_kh: Optional[str] = None
    order_index: int = 0
    is_active: bool = True


class LessonResponse(LessonBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class LetterBase(BaseModel):
    letter_kh: str
    letter_en: Optional[str] = None
    description_en: Optional[str] = None
    description_kh: Optional[str] = None
    is_active: bool = True


class LetterResponse(LetterBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    medias: List[MediaResponse] = []

    model_config = {"from_attributes": True}


# Response shapes used by the curriculum endpoints
class LessonPathItem(BaseModel):
    lesson: LessonResponse
    chapter: Optional[ChapterResponse] = None
    unit: Optional[UnitResponse] = None


class UnitChapterPair(BaseModel):
    unit: UnitResponse
    chapter: ChapterResponse


class LetterDataResponse(BaseModel):
    letter: LetterResponse
    lessons: List[LessonPathItem] = []
    units_and_chapters: List[UnitChapterPair] = []
    medias_count: int = 0

    model_config = {"from_attributes": True}
