"""Protocol regression tests without a model, camera or database connection."""
import asyncio
from types import SimpleNamespace

from fastapi import WebSocketDisconnect

from src.api.routes.word_detection import word_predict_ws as route


class Socket:
    def __init__(self, messages):
        import json
        self.messages = iter(json.dumps(message) for message in messages)
        self.responses = []

    async def accept(self):
        pass

    async def receive_text(self):
        try:
            return next(self.messages)
        except StopIteration:
            raise WebSocketDisconnect()

    async def send_json(self, data):
        self.responses.append(data)


def test_request_identity_and_timing_survive_inference(monkeypatch):
    result = SimpleNamespace(prediction=SimpleNamespace(predicted_label="hello", predicted_class_index=0), match_confidence=95)
    service = SimpleNamespace(is_available=True, predict_from_features=lambda features: result)
    matched = SimpleNamespace(base=result, label_match=SimpleNamespace(target_label="hello", label_matches=True))
    matching = SimpleNamespace(predict_from_features_with_target=lambda features, target_label: matched)
    monkeypatch.setattr(route, "get_word_prediction_service", lambda: service)
    monkeypatch.setattr(route, "get_word_label_match_prediction_service", lambda: matching)
    socket = Socket([
        {"type": "auth", "guestId": "guest_test"},
        {"type": "predict_label_match", "features": [0] * route.WORD_FEATURE_COUNT, "targetLabel": "hello", "requestId": 7, "attemptId": 3},
    ])
    asyncio.run(route.handle_websocket(socket))
    reply = socket.responses[-1]
    assert reply["requestId"] == 7 and reply["attemptId"] == 3
    assert reply["label"] == "hello" and reply["labelMatches"] is True
    assert reply["processingMs"] >= 0


def test_failed_request_can_be_correlated_and_next_request_succeeds(monkeypatch):
    def predict(features):
        if features[0] == 0:
            raise RuntimeError("test failure")
        return SimpleNamespace(prediction=SimpleNamespace(predicted_label="hello", predicted_class_index=0), match_confidence=95)
    monkeypatch.setattr(route, "get_word_prediction_service", lambda: SimpleNamespace(is_available=True, predict_from_features=predict))
    monkeypatch.setattr(route, "get_word_label_match_prediction_service", lambda: object())
    socket = Socket([
        {"type": "auth", "guestId": "guest_test"},
        {"type": "predict", "features": [0], "requestId": 1, "attemptId": 2},
        {"type": "predict", "features": [0] * route.WORD_FEATURE_COUNT, "requestId": 2, "attemptId": 2},
        {"type": "predict", "features": [1] * route.WORD_FEATURE_COUNT, "requestId": 3, "attemptId": 2},
    ])
    asyncio.run(route.handle_websocket(socket))
    assert [response["type"] for response in socket.responses] == ["auth_ok", "error", "error", "prediction"]
    assert [response["requestId"] for response in socket.responses[1:]] == [1, 2, 3]


def test_learning_context_uses_one_session_and_selects_next_live_sibling(monkeypatch):
    from unittest.mock import Mock
    from src.api.routes.word_detection import word_detection_curriculum as curriculum
    from src.schemas.word_detection import WdLessonDetailResponse, WdChapterResponse, WdUnitResponse

    lesson = WdLessonDetailResponse(id=2, chapterId=4, word="hello", videoUrl="", orderIndex=2, isLocked=False, progressStatus="COMPLETED")
    chapter = WdChapterResponse(id=4, unitId=6, title="Chapter", titleKh="", orderIndex=1, level=0, lessonCount=3, completedLessonCount=2)
    unit = WdUnitResponse(id=6, title="Unit", titleKh="", orderIndex=1, chapterCount=1, completedLessonCount=2, totalLessonCount=3)
    lesson_reader, chapter_reader, unit_reader = Mock(return_value=lesson), Mock(return_value=chapter), Mock(return_value=unit)
    monkeypatch.setattr(curriculum, "get_lesson", lesson_reader)
    monkeypatch.setattr(curriculum, "get_chapter", chapter_reader)
    monkeypatch.setattr(curriculum, "get_unit", unit_reader)
    monkeypatch.setattr(curriculum, "WordDetectionCurriculumService", lambda db: SimpleNamespace(list_lessons_for_chapter=lambda chapter_id: [SimpleNamespace(id=3, order_index=3), SimpleNamespace(id=2, order_index=2), SimpleNamespace(id=1, order_index=1)]))
    db, user = object(), object()
    result = curriculum.get_lesson_learning(2, db, user)
    assert result.nextLessonId == 3 and result.lesson.progressStatus == "COMPLETED"
    lesson_reader.assert_called_once_with(2, db, user)
    chapter_reader.assert_called_once_with(4, db, user)
    unit_reader.assert_called_once_with(6, db, user)
    assert curriculum.get_lesson_learning(3, db, user).nextLessonId is None
