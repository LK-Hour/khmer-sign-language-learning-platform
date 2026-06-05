# Frontend Test for Letter "ក" (Ka)

This test suite validates the frontend's ability to fetch and display curriculum data for the Khmer letter "ក" (Ka) from the backend API.

## Test File
- **Location:** `frontend/tests/letter-ka.test.ts`
- **Language:** TypeScript
- **Framework:** Node.js with native fetch API

## Tests Included

1. **Get Letter Data** - Retrieves basic letter information (ID, Khmer/English names, active status)
2. **Letter Media Files** - Verifies 5 media files are linked to the letter and includes file paths
3. **Media Endpoint** - Tests the dedicated `/api/curriculum/letters/ក/medias` endpoint
4. **Lesson Associations** - Validates lesson-to-letter relationship with full lesson details
5. **Curriculum Path** - Verifies unit → chapter → lesson → letter hierarchy
6. **Complete Data Structure** - Ensures all response fields are present and valid

## Running the Test

### Prerequisites
- Backend API server running on `http://localhost:8000`
- Database seeded with curriculum data (see backend `seed_data/README.md`)

### Method 1: Direct Node.js Execution
```bash
cd frontend
npx ts-node tests/letter-ka.test.ts
```

### Method 2: With Environment Variable
```bash
cd frontend
NEXT_PUBLIC_API_URL=http://localhost:8000 npx ts-node tests/letter-ka.test.ts
```

### Method 3: Using npm script (if added)
Add to `package.json`:
```json
{
  "scripts": {
    "test:letter": "ts-node tests/letter-ka.test.ts"
  }
}
```

Then run:
```bash
npm run test:letter
```

## Expected Output

When all tests pass:
```
============================================================
LETTER 'ក' (Ka) FRONTEND TEST SUITE
============================================================
API Base URL: http://localhost:8000

Test 1: Get Letter Data
Test 2: Letter Media Files
Test 3: Media Endpoint
Test 4: Lesson Associations
Test 5: Curriculum Path
Test 6: Complete Structure

============================================================
TEST REPORT
============================================================
Total Tests: 6
Passed: 6
Failed: 0
============================================================

ALL TESTS PASSED! The letter 'ក' API is working correctly.
```

## Sample API Responses

### Letter Data Response
```typescript
{
  "letter": {
    "id": 1,
    "letter_kh": "ក",
    "letter_en": "Ka",
    "description_en": null,
    "description_kh": null,
    "is_active": true,
    "medias": [
      {
        "id": 1,
        "media_type": "image",
        "file_url": "data_set/Fingerspelling data for development/Consonants/ក/Main/ក_Main_0001.png",
        "created_at": "2026-05-26T00:00:00"
      },
      // ... 4 more media files
    ]
  },
  "lessons": [
    {
      "lesson": {
        "id": 1,
        "name_kh": "ក",
        "name_en": "Ka"
      },
      "chapter": {
        "id": 1,
        "name_kh": "ស្រៈមូលដ្ឋាន ទី ១",
        "name_en": "Consonants Chapter 1"
      },
      "unit": {
        "id": 1,
        "name_kh": "ស្រៈមូលដ្ឋាន",
        "name_en": "Consonants"
      }
    }
  ],
  "units_and_chapters": [
    {
      "unit": {
        "id": 1,
        "name_kh": "ស្រៈមូលដ្ឋាន",
        "name_en": "Consonants"
      },
      "chapter": {
        "id": 1,
        "name_kh": "ស្រៈមូលដ្ឋាន ទី ១",
        "name_en": "Consonants Chapter 1"
      }
    }
  ],
  "medias_count": 5
}
```

### Media List Response
```typescript
{
  "letter_kh": "ក",
  "letter_en": "Ka",
  "total_medias": 5,
  "medias": [
    {
      "id": 1,
      "media_type": "image",
      "file_url": "data_set/Fingerspelling data for development/Consonants/ក/Main/ក_Main_0001.png"
    },
    // ... 4 more media files
  ]
}
```

## Troubleshooting

### Error: Failed to fetch
- Ensure backend API is running: `cd backend && python run_server.sh`
- Check `NEXT_PUBLIC_API_URL` environment variable
- Verify database is seeded: `cd backend && python seed_data/seed_curriculum.py`

### Error: Status is 404
- API endpoint `/api/curriculum/letters/ក` not found
- Check that curriculum router is registered in `src/main.py`
- Verify letter "ក" exists in database

### Error: JSON parse error
- API response is not valid JSON
- Check server logs for errors
- Verify database connection is working

## Integration with Frontend Components

This test validates the same data structure used by:
- `src/features/finger-spelling/components/LessonDetailView.tsx`
- `src/features/finger-spelling/api/curriculum.ts`
- `src/app/finger-spelling/lessons/[lessonId]/page.tsx`

The test ensures that the API contract is maintained when making changes to:
1. Backend serialization functions
2. Database schema
3. Media file organization

## Next Steps

- Create similar tests for other letters (sub-consonants, vowels, etc.)
- Add integration tests using React Testing Library
- Add component tests for letter display UI
- Add visual regression testing for media file rendering
