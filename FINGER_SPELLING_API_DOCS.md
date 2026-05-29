# Finger Spelling API - Complete Documentation

**Version:** 2.0  
**Last Updated:** May 29, 2026  
**Base URL:** `http://localhost:8000` (Development)

---

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Common Response Format](#common-response-format)
4. [Curriculum APIs](#curriculum-apis)
5. [Exercise APIs](#exercise-apis)
6. [Practice APIs](#practice-apis)
7. [Progress APIs](#progress-apis)
8. [Error Handling](#error-handling)
9. [Data Types & Models](#data-types--models)

---

## Overview

The Finger Spelling API provides endpoints for managing a comprehensive Khmer sign language learning platform. The API supports:

- **Curriculum browsing** - Navigate units, chapters, lessons, and letters
- **Exercise delivery** - Submit answers to various exercise types
- **Interactive practice** - Practice sessions with accuracy tracking
- **Progress tracking** - Monitor learning progress

### Base URL
```
http://localhost:8000
```

### API Prefix
```
/api/finger_spelling
```

---

## Authentication

### Authentication Methods

Two authentication approaches are supported:

#### 1. OAuth (Recommended)
- Google, Facebook, or Telegram authentication
- Returns JWT token in response
- Use token in `Authorization` header for subsequent requests

#### 2. JWT Bearer Token
- Include in all authenticated endpoints
- Header format: `Authorization: Bearer <your_jwt_token>`

### Endpoint Authentication Rules

| Endpoint | Auth Required | Notes |
|----------|---------------|-------|
| Curriculum GET | Optional | Allows guest browsing |
| Exercise GET | None | Allows guest viewing |
| Exercise POST | **Required** | Tracks progress |
| Practice POST | **Required** | User isolation |
| Practice GET | **Required** | User isolation |
| Progress GET | **Required** | User-specific data |

---

## Common Response Format

All API responses follow a consistent pattern.

### Success Response (2xx)
```json
{
  "data": {...}  // Single object or array
}
```

### Error Response (4xx, 5xx)
```json
{
  "detail": "Error message describing the issue"
}
```

### Standard HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST request |
| 400 | Bad Request | Invalid parameters or invalid session state |
| 401 | Unauthorized | Missing or invalid authentication token |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

---

## Curriculum APIs

### 1. List Units

Retrieve all curriculum units with progress information.

**Endpoint:**
```
GET /api/finger_spelling/curriculum/units
```

**Authentication:** Optional

**Query Parameters:** None

**Request Headers:**
```
Authorization: Bearer <token>  (optional)
Content-Type: application/json
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Letters A-D",
    "titleKh": "អក្សរ ក-ង",
    "category": "Alphabet",
    "orderIndex": 1,
    "chapterCount": 3,
    "completedLessonCount": 2,
    "totalLessonCount": 12
  },
  {
    "id": 2,
    "title": "Letters E-H",
    "titleKh": "អក្សរ ច-ឆ",
    "category": "Alphabet",
    "orderIndex": 2,
    "chapterCount": 3,
    "completedLessonCount": 0,
    "totalLessonCount": 12
  }
]
```

**Field Descriptions:**
- `id` (int): Unique unit identifier
- `title` (string): Unit name in English
- `titleKh` (string): Unit name in Khmer
- `category` (string|null): Optional category grouping
- `orderIndex` (int): Display order (1-based)
- `chapterCount` (int): Number of chapters in this unit
- `completedLessonCount` (int): Lessons user has completed (0 if guest)
- `totalLessonCount` (int): Total lessons across all chapters

**Error Cases:**
- None (always returns valid array)

---

### 2. Get Single Unit

Retrieve details for a specific unit.

**Endpoint:**
```
GET /api/finger_spelling/curriculum/units/{unit_id}
```

**Path Parameters:**
- `unit_id` (int, required): The unit ID to retrieve

**Authentication:** Optional

**Example Request:**
```
GET /api/finger_spelling/curriculum/units/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Letters A-D",
  "titleKh": "អក្សរ ក-ង",
  "category": "Alphabet",
  "orderIndex": 1,
  "chapterCount": 3,
  "completedLessonCount": 2,
  "totalLessonCount": 12
}
```

**Error Cases:**
- `404 Not Found`: Unit with given ID doesn't exist

```json
{
  "detail": "Unit not found"
}
```

---

### 3. List Chapters in Unit

Retrieve all chapters for a specific unit.

**Endpoint:**
```
GET /api/finger_spelling/curriculum/units/{unit_id}/chapters
```

**Path Parameters:**
- `unit_id` (int, required): The unit ID

**Authentication:** Optional

**Example Request:**
```
GET /api/finger_spelling/curriculum/units/1/chapters
```

**Response:** `200 OK`
```json
[
  {
    "id": 5,
    "unitId": 1,
    "title": "Introduction",
    "titleKh": "សេចក្តីណែនាំ",
    "description": "Learn basic hand shapes",
    "descriptionKh": "រៀនពិបាក់ដៃមូលដ្ឋាន",
    "orderIndex": 1,
    "lessonCount": 4,
    "completedLessonCount": 2,
    "isQuizUnlocked": false
  },
  {
    "id": 6,
    "unitId": 1,
    "title": "Basic Signs",
    "titleKh": "សញ្ញាមូលដ្ឋាន",
    "description": "Practice common finger spellings",
    "descriptionKh": null,
    "orderIndex": 2,
    "lessonCount": 4,
    "completedLessonCount": 0,
    "isQuizUnlocked": false
  }
]
```

**Field Descriptions:**
- `id` (int): Chapter unique identifier
- `unitId` (int): Parent unit ID
- `title` (string): Chapter name in English
- `titleKh` (string): Chapter name in Khmer
- `description` (string|null): Optional English description
- `descriptionKh` (string|null): Optional Khmer description
- `orderIndex` (int): Display order within unit
- `lessonCount` (int): Number of lessons in chapter
- `completedLessonCount` (int): Lessons completed by user
- `isQuizUnlocked` (boolean): True if all lessons completed

**Error Cases:**
- `404 Not Found`: Unit not found

```json
{
  "detail": "Unit not found"
}
```

---

### 4. Get Chapter Details

Get detailed information about a single chapter.

**Endpoint:**
```
GET /api/finger_spelling/curriculum/chapters/{chapter_id}
```

**Path Parameters:**
- `chapter_id` (int, required): The chapter ID

**Authentication:** Optional

**Example Request:**
```
GET /api/finger_spelling/curriculum/chapters/5
```

**Response:** `200 OK`
```json
{
  "id": 5,
  "unitId": 1,
  "title": "Introduction",
  "titleKh": "សេចក្តីណែនាំ",
  "description": "Learn basic hand shapes",
  "descriptionKh": "រៀនពិបាក់ដៃមូលដ្ឋាន",
  "orderIndex": 1,
  "lessonCount": 4,
  "completedLessonCount": 2,
  "isQuizUnlocked": false
}
```

**Error Cases:**
- `404 Not Found`: Chapter not found

---

### 5. List Lessons in Chapter

Retrieve all lessons in a chapter with progress information.

**Endpoint:**
```
GET /api/finger_spelling/curriculum/chapters/{chapter_id}/lessons
```

**Path Parameters:**
- `chapter_id` (int, required): The chapter ID

**Authentication:** Optional

**Example Request:**
```
GET /api/finger_spelling/curriculum/chapters/5/lessons
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": 10,
    "chapterId": 5,
    "letter": "ក",
    "romanization": "ka",
    "letterNameEn": "Ka",
    "letterNameKh": "កា",
    "imageUrl": "https://cdn.example.com/letters/ka.png",
    "orderIndex": 1,
    "isLocked": false,
    "progressStatus": "NOT_STARTED"
  },
  {
    "id": 11,
    "chapterId": 5,
    "letter": "ខ",
    "romanization": "kha",
    "letterNameEn": "Kha",
    "letterNameKh": "ខា",
    "imageUrl": "https://cdn.example.com/letters/kha.png",
    "orderIndex": 2,
    "isLocked": false,
    "progressStatus": "IN_PROGRESS"
  },
  {
    "id": 12,
    "chapterId": 5,
    "letter": "គ",
    "romanization": "ko",
    "letterNameEn": "Ko",
    "letterNameKh": "គា",
    "imageUrl": "https://cdn.example.com/letters/ko.png",
    "orderIndex": 3,
    "isLocked": true,
    "progressStatus": "NOT_STARTED"
  }
]
```

**Field Descriptions:**
- `id` (int): Lesson unique identifier
- `chapterId` (int): Parent chapter ID
- `letter` (string): Khmer letter (single character)
- `romanization` (string|null): Latin script representation
- `letterNameEn` (string|null): Letter name in English
- `letterNameKh` (string|null): Letter name in Khmer
- `imageUrl` (string): URL to letter thumbnail
- `orderIndex` (int): Display order in chapter
- `isLocked` (boolean): True if user hasn't unlocked
- `progressStatus` (string): "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"

**Error Cases:**
- `404 Not Found`: Chapter not found

---

### 6. Get Lesson Details

Get comprehensive lesson information including all letters and media.

**Endpoint:**
```
GET /api/finger_spelling/curriculum/lessons/{lesson_id}
```

**Path Parameters:**
- `lesson_id` (int, required): The lesson ID

**Authentication:** Optional

**Example Request:**
```
GET /api/finger_spelling/curriculum/lessons/10
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": 10,
  "chapterId": 5,
  "letter": "ក",
  "romanization": "ka",
  "letterNameEn": "Ka",
  "letterNameKh": "កា",
  "imageUrl": "https://cdn.example.com/letters/ka.png",
  "orderIndex": 1,
  "isLocked": false,
  "progressStatus": "IN_PROGRESS",
  "description": "The first consonant of the Khmer alphabet",
  "descriptionKh": "អក្សរឧប្បដ្ឋមៈលេខ១នៃអក្ខរក្រម"
}
```

**Additional Fields (vs Lesson List):**
- `description` (string|null): Detailed English description
- `descriptionKh` (string|null): Detailed Khmer description

**Error Cases:**
- `404 Not Found`: Lesson not found

---

## Exercise APIs

### 1. List Exercises for Lesson

Get all exercises available for a lesson.

**Endpoint:**
```
GET /api/finger_spelling/exercise/lessons/{lesson_id}
```

**Path Parameters:**
- `lesson_id` (int, required): The lesson ID

**Authentication:** Not Required

**Example Request:**
```
GET /api/finger_spelling/exercise/lessons/10
```

**Response:** `200 OK`
```json
[
  {
    "id": 45,
    "lesson_id": 10,
    "question_en": "What letter is this?",
    "question_kh": "តើលិប្ប័ន៍នេះជាអក្សរលេខប៉ុន្មាន?",
    "exercise_type": "multiple_choice",
    "media_id": 123,
    "order_index": 1,
    "options": [
      {
        "id": 201,
        "option_text_en": "Ka",
        "option_text_kh": "កា",
        "media_id": null,
        "order_index": 1,
        "media": null
      },
      {
        "id": 202,
        "option_text_en": "Kha",
        "option_text_kh": "ខា",
        "media_id": null,
        "order_index": 2,
        "media": null
      },
      {
        "id": 203,
        "option_text_en": "Ko",
        "option_text_kh": "គា",
        "media_id": null,
        "order_index": 3,
        "media": null
      }
    ],
    "media": {
      "id": 123,
      "media_type": "video",
      "file_url": "https://cdn.example.com/videos/ka-sign.mp4",
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-01-15T10:30:00Z"
    }
  },
  {
    "id": 46,
    "lesson_id": 10,
    "question_en": "Type the Khmer letter you see",
    "question_kh": "សូមវាយលិប្ប័ន៍ខ្មែរដែលអ្នកឃើញ",
    "exercise_type": "free_form",
    "media_id": 124,
    "order_index": 2,
    "options": [],
    "media": {
      "id": 124,
      "media_type": "image",
      "file_url": "https://cdn.example.com/images/ka-letter.png",
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-01-15T10:30:00Z"
    }
  }
]
```

**Field Descriptions:**
- `id` (int): Exercise unique identifier
- `lesson_id` (int): Parent lesson ID
- `question_en` (string): Question text in English
- `question_kh` (string): Question text in Khmer
- `exercise_type` (string): "multiple_choice" | "free_form" | "image_select" | "matching"
- `media_id` (int|null): Associated media ID
- `order_index` (int): Display order
- `options` (array): Answer options (empty for free_form)
- `media` (object|null): Media details

**Media Object:**
- `id` (int): Media unique identifier
- `media_type` (string): "video" | "gif" | "image"
- `file_url` (string): Direct URL to media file
- `created_at` (string): ISO 8601 timestamp
- `updated_at` (string): ISO 8601 timestamp

**Exercise Types:**
- **multiple_choice**: Select one option from list
- **free_form**: Type Khmer text answer (case-insensitive)
- **image_select**: Tap/click the correct image
- **matching**: Match pairs of items

**Error Cases:**
- `404 Not Found`: Lesson not found

```json
{
  "detail": "Lesson not found"
}
```

---

### 2. Submit Exercise Answer

Submit an answer to an exercise and receive grading feedback.

**Endpoint:**
```
POST /api/finger_spelling/exercise/{exercise_id}/submit
```

**Path Parameters:**
- `exercise_id` (int, required): The exercise ID

**Authentication:** Required

**Request Body:**
```json
{
  "selected_option_id": 201,
  "selected_answer": null,
  "time_taken": 45
}
```

**Request Parameters:**
- `selected_option_id` (int|null): ID of selected option (for multiple_choice/image_select/matching)
- `selected_answer` (string|null): Text answer (for free_form)
- `time_taken` (int, default: 0): Time spent on exercise in seconds

**Example: Multiple Choice Answer**
```
POST /api/finger_spelling/exercise/45/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "selected_option_id": 201,
  "selected_answer": null,
  "time_taken": 30
}
```

**Response:** `200 OK`
```json
{
  "is_correct": true,
  "attempt_number": 1,
  "progress_id": "550e8400-e29b-41d4-a716-446655440000",
  "explanation_en": "Correct! ក is the first letter of the Khmer alphabet.",
  "explanation_kh": "ត្រឹមត្រូវ! ក គឺជាលិប្ប័ន៍ដំបូងនៃអក្ខរក្រមខ្មែរ។"
}
```

**Response Field Descriptions:**
- `is_correct` (boolean): Whether answer is correct
- `attempt_number` (int): Attempt count for this exercise
- `progress_id` (string): UUID of progress record
- `explanation_en` (string|null): Feedback in English
- `explanation_kh` (string|null): Feedback in Khmer

**Example: Free Form Answer**
```
POST /api/finger_spelling/exercise/46/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "selected_option_id": null,
  "selected_answer": "ក",
  "time_taken": 60
}
```

**Response:** `200 OK`
```json
{
  "is_correct": true,
  "attempt_number": 1,
  "progress_id": "550e8400-e29b-41d4-a716-446655440001",
  "explanation_en": "Perfect! You typed ក correctly.",
  "explanation_kh": null
}
```

**Error Cases:**

**400 Bad Request** - Invalid session or invalid form
```json
{
  "detail": "Exercise not found"
}
```

**401 Unauthorized** - Missing authentication
```json
{
  "detail": "Not authenticated"
}
```

**Grading Rules:**
- **Multiple Choice**: Correct if `selected_option_id` matches the correct option
- **Free Form**: Case-insensitive comparison with correct answer
- **Image Select**: Correct if image ID is correct
- **Matching**: Correct if all pairs are matched correctly

---

## Practice APIs

### 1. Start Practice Session

Initialize a new practice session for a lesson.

**Endpoint:**
```
POST /api/finger_spelling/practice/lessons/{lesson_id}/sessions
```

**Path Parameters:**
- `lesson_id` (int, required): The lesson ID to practice

**Authentication:** Required

**Request Body:**
```json
{
  "media_id": null
}
```

**Request Parameters:**
- `media_id` (int|null): Optional specific media to reference

**Example Request:**
```
POST /api/finger_spelling/practice/lessons/10/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "media_id": 123
}
```

**Response:** `201 Created`
```json
{
  "id": 789,
  "lesson_id": 10,
  "started_at": "2026-05-29T14:30:00Z",
  "is_completed": false
}
```

**Response Field Descriptions:**
- `id` (int): Practice session unique identifier
- `lesson_id` (int): Associated lesson ID
- `started_at` (string): ISO 8601 session start timestamp
- `is_completed` (boolean): Always false for new sessions

**Error Cases:**
- `404 Not Found`: Lesson not found

```json
{
  "detail": "Lesson not found"
}
```

---

### 2. Submit Practice Letter

Submit accuracy data for a letter during a practice session.

**Endpoint:**
```
POST /api/finger_spelling/practice/sessions/{session_id}/letters
```

**Path Parameters:**
- `session_id` (int, required): The session ID

**Authentication:** Required

**Request Body:**
```json
{
  "letter_id": 10,
  "accuracy": 85.5,
  "attempts": 1,
  "time_spent_seconds": 45,
  "media_id": 123
}
```

**Request Parameters:**
- `letter_id` (int, required): The letter ID being practiced
- `accuracy` (float|null): Accuracy percentage (0-100)
- `attempts` (int, default: 1): Number of attempts for this letter
- `time_spent_seconds` (int, default: 0): Time spent on letter in seconds
- `media_id` (int|null): Optional media ID used

**Example Request:**
```
POST /api/finger_spelling/practice/sessions/789/letters
Authorization: Bearer <token>
Content-Type: application/json

{
  "letter_id": 10,
  "accuracy": 85.5,
  "attempts": 1,
  "time_spent_seconds": 45,
  "media_id": 123
}
```

**Response:** `200 OK`
```json
{
  "session_id": 789,
  "letter_id": 10,
  "accuracy": 85.5
}
```

**Response Field Descriptions:**
- `session_id` (int): The session ID
- `letter_id` (int): The letter ID
- `accuracy` (float|null): Recorded accuracy value

**Error Cases:**
- `400 Bad Request`: Invalid session or letter not in lesson

```json
{
  "detail": "Invalid or completed practice session, or letter not in lesson"
}
```

---

### 3. Get Mid-Session Accuracy (NEW)

Get current accuracy statistics without ending the session.

**Endpoint:**
```
GET /api/finger_spelling/practice/sessions/{session_id}/accuracy
```

**Path Parameters:**
- `session_id` (int, required): The session ID

**Authentication:** Required

**Example Request:**
```
GET /api/finger_spelling/practice/sessions/789/accuracy
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "session_id": 789,
  "lesson_id": 10,
  "average_accuracy": 85.2,
  "peak_accuracy": 92.0,
  "samples": 3,
  "is_completed": false
}
```

**Response Field Descriptions:**
- `session_id` (int): The session ID
- `lesson_id` (int): Associated lesson ID
- `average_accuracy` (float|null): Mean accuracy across all submissions
- `peak_accuracy` (float|null): Highest accuracy recorded
- `samples` (int): Number of letter submissions
- `is_completed` (boolean): Whether session is finished

**Error Cases:**
- `404 Not Found`: Session not found or belongs to different user

```json
{
  "detail": "Practice session not found"
}
```

---

### 4. End Practice Session

Complete a practice session and calculate final statistics.

**Endpoint:**
```
POST /api/finger_spelling/practice/sessions/{session_id}/end
```

**Path Parameters:**
- `session_id` (int, required): The session ID to end

**Authentication:** Required

**Request Body:** Empty (no body parameters)

**Example Request:**
```
POST /api/finger_spelling/practice/sessions/789/end
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "session_id": 789,
  "lesson_id": 10,
  "average_accuracy": 85.2,
  "peak_accuracy": 92.0,
  "duration_seconds": 450,
  "lesson_completed": true
}
```

**Response Field Descriptions:**
- `session_id` (int): The completed session ID
- `lesson_id` (int): Associated lesson ID
- `average_accuracy` (float|null): Mean accuracy across session
- `peak_accuracy` (float|null): Highest accuracy achieved
- `duration_seconds` (int): Total session duration in seconds
- `lesson_completed` (boolean): Whether lesson is now marked complete

**Completion Logic:**
- Lesson auto-completes if `peak_accuracy >= 80.0`
- `lesson_completed` reflects final status

**Error Cases:**
- `400 Bad Request`: Session not found or already completed

```json
{
  "detail": "Practice session not found or already completed"
}
```

---

## Progress APIs

### 1. Get Lesson Progress

Retrieve detailed progress information for a specific lesson.

**Endpoint:**
```
GET /api/finger_spelling/progress/lessons/{lesson_id}
```

**Path Parameters:**
- `lesson_id` (int, required): The lesson ID

**Authentication:** Required

**Example Request:**
```
GET /api/finger_spelling/progress/lessons/10
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "lessonId": 10,
  "progressStatus": "IN_PROGRESS",
  "isLocked": false,
  "attempts": 3,
  "totalTimeSpent": 450,
  "peakAccuracy": 92.5,
  "startedAt": "2026-05-28T10:30:00Z",
  "completedAt": null,
  "lastAccessedAt": "2026-05-29T14:30:00Z"
}
```

**Response Field Descriptions:**
- `lessonId` (int): The lesson ID
- `progressStatus` (string): "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
- `isLocked` (boolean): True if lesson is locked (prerequisites not met)
- `attempts` (int): Total exercise attempts for this lesson
- `totalTimeSpent` (int): Cumulative seconds spent on lesson
- `peakAccuracy` (float|null): Highest accuracy achieved (from practice)
- `startedAt` (string|null): ISO 8601 when first started
- `completedAt` (string|null): ISO 8601 when completed (if completed)
- `lastAccessedAt` (string|null): ISO 8601 of most recent access

**Status Meaning:**
- **NOT_STARTED**: Never accessed
- **IN_PROGRESS**: Accessed but not yet completed
- **COMPLETED**: Finished (exercises OR practice with 80%+ accuracy)

**Locked Rules:**
- Lesson 1 is always unlocked
- Subsequent lessons require prior lesson completion
- Guest users can only access lesson 1

**Error Cases:**
- `404 Not Found`: Lesson not found

```json
{
  "detail": "Lesson not found"
}
```

**Example: Not Started Lesson**
```json
{
  "lessonId": 15,
  "progressStatus": "NOT_STARTED",
  "isLocked": true,
  "attempts": 0,
  "totalTimeSpent": 0,
  "peakAccuracy": null,
  "startedAt": null,
  "completedAt": null,
  "lastAccessedAt": null
}
```

---

### 2. Get Chapter Progress

Retrieve progress for all lessons in a chapter.

**Endpoint:**
```
GET /api/finger_spelling/progress/chapters/{chapter_id}
```

**Path Parameters:**
- `chapter_id` (int, required): The chapter ID

**Authentication:** Required

**Example Request:**
```
GET /api/finger_spelling/progress/chapters/5
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "chapterId": 5,
  "completedLessonCount": 3,
  "totalLessonCount": 4,
  "isQuizUnlocked": false,
  "lessons": [
    {
      "lessonId": 10,
      "orderIndex": 1,
      "progressStatus": "COMPLETED",
      "isLocked": false
    },
    {
      "lessonId": 11,
      "orderIndex": 2,
      "progressStatus": "COMPLETED",
      "isLocked": false
    },
    {
      "lessonId": 12,
      "orderIndex": 3,
      "progressStatus": "IN_PROGRESS",
      "isLocked": false
    },
    {
      "lessonId": 13,
      "orderIndex": 4,
      "progressStatus": "NOT_STARTED",
      "isLocked": true
    }
  ]
}
```

**Response Field Descriptions:**
- `chapterId` (int): The chapter ID
- `completedLessonCount` (int): Number of completed lessons
- `totalLessonCount` (int): Total lessons in chapter
- `isQuizUnlocked` (boolean): True if all lessons completed
- `lessons` (array): Array of lesson progress items

**Lesson Progress Item:**
- `lessonId` (int): Lesson unique ID
- `orderIndex` (int): Order within chapter
- `progressStatus` (string): "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
- `isLocked` (boolean): Whether lesson is locked

**Error Cases:**
- `404 Not Found`: Chapter not found

```json
{
  "detail": "Chapter not found"
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Scenario | Example |
|------|----------|---------|
| 200 | Successful GET | Retrieved data |
| 201 | Successful POST | Created resource |
| 400 | Bad Request | Invalid parameters, completed session |
| 401 | Unauthorized | Missing token, invalid token |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Database error, unhandled exception |

### Error Response Format

All error responses follow this format:

```json
{
  "detail": "Description of the error"
}
```

### Common Error Messages

**Resource Not Found:**
```json
{
  "detail": "Unit not found"
}
```

**Not Authenticated:**
```json
{
  "detail": "Not authenticated"
}
```

**Session Completed:**
```json
{
  "detail": "Invalid or completed practice session, or letter not in lesson"
}
```

**Invalid Lesson:**
```json
{
  "detail": "Lesson not found"
}
```

---

## Data Types & Models

### MediaResponse
```json
{
  "id": 123,
  "media_type": "video",
  "file_url": "https://cdn.example.com/videos/ka-sign.mp4",
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-15T10:30:00Z"
}
```

**Fields:**
- `id` (int): Unique identifier
- `media_type` (string): "video" | "gif" | "image"
- `file_url` (string): Direct URL to media file
- `created_at` (string): ISO 8601 creation timestamp
- `updated_at` (string): ISO 8601 last update timestamp

### ExerciseOption
```json
{
  "id": 201,
  "option_text_en": "Ka",
  "option_text_kh": "កា",
  "media_id": null,
  "order_index": 1,
  "media": null
}
```

**Fields:**
- `id` (int): Option unique ID
- `option_text_en` (string|null): Option text in English
- `option_text_kh` (string|null): Option text in Khmer
- `media_id` (int|null): Associated media ID
- `order_index` (int): Display order
- `media` (MediaResponse|null): Full media object if included

### DateTime Format

All timestamps are in ISO 8601 format with UTC timezone:

```
2026-05-29T14:30:00Z
```

**Components:**
- **Date:** YYYY-MM-DD (e.g., 2026-05-29)
- **Time:** HH:MM:SS (24-hour format)
- **Timezone:** Z (UTC/Zulu time)

### Error Details

When an API returns an error, the error detail always follows this pattern:

```json
{
  "detail": "Clear description of what went wrong"
}
```

No nested error objects are used. All errors use this simple format.

---

## Complete Request/Response Examples

### Example 1: User Gets Units and Selects One

**Step 1: List all units**
```
GET /api/finger_spelling/curriculum/units
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Letters A-D",
    "titleKh": "អក្សរ ក-ង",
    "category": "Alphabet",
    "orderIndex": 1,
    "chapterCount": 3,
    "completedLessonCount": 2,
    "totalLessonCount": 12
  }
]
```

**Step 2: Get chapters in unit 1**
```
GET /api/finger_spelling/curriculum/units/1/chapters
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 5,
    "unitId": 1,
    "title": "Introduction",
    "titleKh": "សេចក្តីណែនាំ",
    "orderIndex": 1,
    "lessonCount": 4,
    "completedLessonCount": 2,
    "isQuizUnlocked": false
  }
]
```

### Example 2: User Practices a Lesson

**Step 1: Start session**
```
POST /api/finger_spelling/practice/lessons/10/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "media_id": 123
}
```

**Response:**
```json
{
  "id": 789,
  "lesson_id": 10,
  "started_at": "2026-05-29T14:30:00Z",
  "is_completed": false
}
```

**Step 2: Submit first letter**
```
POST /api/finger_spelling/practice/sessions/789/letters
Authorization: Bearer <token>
Content-Type: application/json

{
  "letter_id": 10,
  "accuracy": 85.5,
  "attempts": 1,
  "time_spent_seconds": 45,
  "media_id": 123
}
```

**Response:**
```json
{
  "session_id": 789,
  "letter_id": 10,
  "accuracy": 85.5
}
```

**Step 3: Check mid-session accuracy**
```
GET /api/finger_spelling/practice/sessions/789/accuracy
Authorization: Bearer <token>
```

**Response:**
```json
{
  "session_id": 789,
  "lesson_id": 10,
  "average_accuracy": 85.2,
  "peak_accuracy": 92.0,
  "samples": 3,
  "is_completed": false
}
```

**Step 4: End session**
```
POST /api/finger_spelling/practice/sessions/789/end
Authorization: Bearer <token>
```

**Response:**
```json
{
  "session_id": 789,
  "lesson_id": 10,
  "average_accuracy": 85.2,
  "peak_accuracy": 92.0,
  "duration_seconds": 450,
  "lesson_completed": true
}
```

### Example 3: User Completes an Exercise

**Step 1: Get exercises**
```
GET /api/finger_spelling/exercise/lessons/10
```

**Response:**
```json
[
  {
    "id": 45,
    "lesson_id": 10,
    "question_en": "What letter is this?",
    "question_kh": "តើលិប្ប័ន៍នេះជាលេខប៉ុន្មាន?",
    "exercise_type": "multiple_choice",
    "media_id": 123,
    "order_index": 1,
    "options": [
      {
        "id": 201,
        "option_text_en": "Ka",
        "option_text_kh": "កា",
        "media_id": null,
        "order_index": 1,
        "media": null
      },
      {
        "id": 202,
        "option_text_en": "Kha",
        "option_text_kh": "ខា",
        "media_id": null,
        "order_index": 2,
        "media": null
      }
    ],
    "media": {
      "id": 123,
      "media_type": "video",
      "file_url": "https://cdn.example.com/videos/ka-sign.mp4",
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-01-15T10:30:00Z"
    }
  }
]
```

**Step 2: Submit answer**
```
POST /api/finger_spelling/exercise/45/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "selected_option_id": 201,
  "selected_answer": null,
  "time_taken": 30
}
```

**Response:**
```json
{
  "is_correct": true,
  "attempt_number": 1,
  "progress_id": "550e8400-e29b-41d4-a716-446655440000",
  "explanation_en": "Correct! ក is the first letter of the Khmer alphabet.",
  "explanation_kh": "ត្រឹមត្រូវ! ក គឺជាលិប្ប័ន៍ដំបូងនៃអក្ខរក្រមខ្មែរ។"
}
```

### Example 4: User Checks Progress

**Step 1: Get lesson progress**
```
GET /api/finger_spelling/progress/lessons/10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "lessonId": 10,
  "progressStatus": "COMPLETED",
  "isLocked": false,
  "attempts": 3,
  "totalTimeSpent": 450,
  "peakAccuracy": 92.5,
  "startedAt": "2026-05-28T10:30:00Z",
  "completedAt": "2026-05-29T14:45:00Z",
  "lastAccessedAt": "2026-05-29T14:45:00Z"
}
```

**Step 2: Get chapter progress**
```
GET /api/finger_spelling/progress/chapters/5
Authorization: Bearer <token>
```

**Response:**
```json
{
  "chapterId": 5,
  "completedLessonCount": 3,
  "totalLessonCount": 4,
  "isQuizUnlocked": false,
  "lessons": [
    {
      "lessonId": 10,
      "orderIndex": 1,
      "progressStatus": "COMPLETED",
      "isLocked": false
    },
    {
      "lessonId": 11,
      "orderIndex": 2,
      "progressStatus": "IN_PROGRESS",
      "isLocked": false
    },
    {
      "lessonId": 12,
      "orderIndex": 3,
      "progressStatus": "NOT_STARTED",
      "isLocked": true
    }
  ]
}
```

---

## Quick Reference

### API Endpoints Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/curriculum/units` | Optional | List units |
| GET | `/curriculum/units/{id}` | Optional | Get unit |
| GET | `/curriculum/units/{id}/chapters` | Optional | List chapters |
| GET | `/curriculum/chapters/{id}` | Optional | Get chapter |
| GET | `/curriculum/chapters/{id}/lessons` | Optional | List lessons |
| GET | `/curriculum/lessons/{id}` | Optional | Get lesson |
| GET | `/exercise/lessons/{id}` | None | List exercises |
| POST | `/exercise/{id}/submit` | Required | Submit answer |
| POST | `/practice/lessons/{id}/sessions` | Required | Start session |
| POST | `/practice/sessions/{id}/letters` | Required | Submit letter |
| POST | `/practice/sessions/{id}/end` | Required | End session |
| GET | `/practice/sessions/{id}/accuracy` | Required | Get accuracy |
| GET | `/progress/lessons/{id}` | Required | Get lesson progress |
| GET | `/progress/chapters/{id}` | Required | Get chapter progress |

### Request Body Templates

**Practice Session Start:**
```json
{
  "media_id": null
}
```

**Exercise Submit:**
```json
{
  "selected_option_id": 201,
  "selected_answer": null,
  "time_taken": 30
}
```

**Practice Letter Submit:**
```json
{
  "letter_id": 10,
  "accuracy": 85.5,
  "attempts": 1,
  "time_spent_seconds": 45,
  "media_id": 123
}
```

---

**Document Version:** 2.0  
**Last Updated:** May 29, 2026  
**API Version:** 1.0
