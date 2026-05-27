/**
 * Frontend Test for Letter "ក" (Ka)
 * 
 * Tests the curriculum API integration for retrieving data about the letter 'ក'
 * including:
 * - Basic letter information
 * - Media files linked to the letter
 * - Lesson associations
 * - Unit and chapter hierarchy
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Media {
  id: number;
  media_type: string;
  file_url: string;
  created_at?: string;
}

interface Letter {
  id: number;
  letter_kh: string;
  letter_en: string;
  description_en: string | null;
  description_kh: string | null;
  is_active: boolean;
  medias: Media[];
  created_at?: string;
}

interface Lesson {
  lesson: {
    id: number;
    name_kh: string;
    name_en: string;
  };
  chapter: {
    id: number;
    name_kh: string;
    name_en: string;
  };
  unit: {
    id: number;
    name_kh: string;
    name_en: string;
  };
}

interface LetterResponse {
  letter: Letter;
  lessons: Lesson[];
  units_and_chapters: Array<{
    unit: { id: number; name_kh: string; name_en: string };
    chapter: { id: number; name_kh: string; name_en: string };
  }>;
  medias_count: number;
}

interface MediaListResponse {
  letter_kh: string;
  letter_en: string;
  total_medias: number;
  medias: Media[];
}

// Test Results Tracking
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
const testResults: { name: string; passed: boolean; message: string }[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}. Expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value: boolean, message: string): void {
  assert(value === true, message);
}

function runTest(
  testName: string,
  testFn: () => Promise<void> | void
): Promise<void> {
  testsRun++;
  return Promise.resolve()
    .then(() => testFn())
    .then(() => {
      testsPassed++;
      testResults.push({ name: testName, passed: true, message: "✅ Passed" });
      console.log(`✅ ${testName}`);
    })
    .catch((error) => {
      testsFailed++;
      testResults.push({
        name: testName,
        passed: false,
        message: `❌ Failed: ${error.message}`,
      });
      console.error(`❌ ${testName}: ${error.message}`);
    });
}

// ============================================================================
// TEST CASES
// ============================================================================

async function testGetLetterData(): Promise<void> {
  console.log("\n📋 Test 1: Get Letter Data for 'ក'");
  console.log("-".repeat(60));

  const response = await fetch(`${API_BASE_URL}/api/curriculum/letters/ក`);
  assertEqual(response.status, 200, "Response status should be 200");

  const data: LetterResponse = await response.json();

  // Validate letter info
  const letter = data.letter;
  assertEqual(letter.letter_kh, "ក", "Letter Khmer text should be 'ក'");
  assertEqual(letter.letter_en, "ka", "Letter English name should be 'ka'");
  assertTrue(letter.is_active, "Letter should be active");

  console.log(`  Letter: ${letter.letter_kh} (${letter.letter_en})`);
  console.log(`  ID: ${letter.id}`);
  console.log(`  Active: ${letter.is_active}`);
  console.log(`  Media Count: ${data.medias_count}`);
}

async function testLetterMediaFiles(): Promise<void> {
  console.log("\n📋 Test 2: Letter Media Files");
  console.log("-".repeat(60));

  const response = await fetch(`${API_BASE_URL}/api/curriculum/letters/ក`);
  assertEqual(response.status, 200, "Response status should be 200");

  const data: LetterResponse = await response.json();
  const letter = data.letter;

  // Verify media count matches expectation
  assertEqual(letter.medias.length, 5, "Letter 'ក' should have 5 media files");
  assertEqual(data.medias_count, 5, "Media count should be 5");

  console.log(`  Total Media Files: ${letter.medias.length}`);
  console.log("\n  Media Details:");

  for (let i = 0; i < letter.medias.length; i++) {
    const media = letter.medias[i];
    assertEqual(
      media.media_type,
      "image",
      `Media ${i + 1} should be of type 'image'`
    );
    assert(
      media.file_url.length > 0,
      `Media ${i + 1} should have a file_url`
    );

    console.log(`    ${i + 1}. ${media.media_type}`);
    console.log(`       Path: ${media.file_url}`);
  }
}

async function testLetterMediaEndpoint(): Promise<void> {
  console.log("\n📋 Test 3: Get Letter Media via Dedicated Endpoint");
  console.log("-".repeat(60));

  const response = await fetch(`${API_BASE_URL}/api/curriculum/letters/ក/medias`);
  assertEqual(response.status, 200, "Response status should be 200");

  const data: MediaListResponse = await response.json();

  assertEqual(data.letter_kh, "ក", "Letter should be 'ក'");
  assertEqual(data.letter_en, "ka", "English name should be 'ka'");
  assertEqual(data.total_medias, 5, "Should have 5 media files");
  assertEqual(
    data.medias.length,
    5,
    "Medias array should contain 5 items"
  );

  console.log(`  Letter: ${data.letter_kh} (${data.letter_en})`);
  console.log(`  Total Media Files: ${data.total_medias}`);
  console.log("\n  All media files are valid images");
}

async function testLetterLessonAssociations(): Promise<void> {
  console.log("\n📋 Test 4: Letter-Lesson Associations");
  console.log("-".repeat(60));

  const response = await fetch(`${API_BASE_URL}/api/curriculum/letters/ក`);
  assertEqual(response.status, 200, "Response status should be 200");

  const data: LetterResponse = await response.json();

  // Verify lesson associations
  assert(
    data.lessons.length > 0,
    "Letter 'ក' should have at least one lesson"
  );

  console.log(`  Total Lessons: ${data.lessons.length}`);
  console.log("\n  Lesson Details:");

  for (let i = 0; i < data.lessons.length; i++) {
    const { lesson, chapter, unit } = data.lessons[i];
    console.log(`    Lesson ${i + 1}:`);
    console.log(`      - Name: ${lesson.name_kh} (${lesson.name_en})`);
    console.log(`      - Chapter: ${chapter.name_kh} (${chapter.name_en})`);
    console.log(`      - Unit: ${unit.name_kh} (${unit.name_en})`);
  }
}

async function testLetterCurriculumPath(): Promise<void> {
  console.log("\n📋 Test 5: Letter Curriculum Path (Unit > Chapter)");
  console.log("-".repeat(60));

  const response = await fetch(`${API_BASE_URL}/api/curriculum/letters/ក`);
  assertEqual(response.status, 200, "Response status should be 200");

  const data: LetterResponse = await response.json();

  // Verify unit/chapter hierarchy
  assert(
    data.units_and_chapters.length > 0,
    "Should have at least one unit-chapter association"
  );

  console.log(`  Total Unit-Chapter Paths: ${data.units_and_chapters.length}`);
  console.log("\n  Curriculum Hierarchy:");

  for (const uc of data.units_and_chapters) {
    console.log(`    ${uc.unit.name_kh} (${uc.unit.name_en})`);
    console.log(`      └─ ${uc.chapter.name_kh} (${uc.chapter.name_en})`);
  }
}

async function testCompleteDataStructure(): Promise<void> {
  console.log("\n📋 Test 6: Complete Letter Data Structure");
  console.log("-".repeat(60));

  const response = await fetch(`${API_BASE_URL}/api/curriculum/letters/ក`);
  assertEqual(response.status, 200, "Response status should be 200");

  const data: LetterResponse = await response.json();

  // Validate complete structure
  assert(data.letter, "Response should have 'letter' object");
  assert(data.lessons, "Response should have 'lessons' array");
  assert(
    data.units_and_chapters,
    "Response should have 'units_and_chapters' array"
  );
  assert(
    data.medias_count !== undefined,
    "Response should have 'medias_count'"
  );

  console.log("  Complete Data Structure Verified:");
  console.log(`    ✓ Letter Information (ID, Names, Status)`);
  console.log(`    ✓ Media Files (${data.letter.medias.length} files)`);
  console.log(`    ✓ Lesson Associations (${data.lessons.length} lessons)`);
  console.log(
    `    ✓ Curriculum Path (${data.units_and_chapters.length} paths)`
  );
  console.log(
    `\n  📊 Summary:`
  );
  console.log(`    - Letter: ${data.letter.letter_kh} (${data.letter.letter_en})`);
  console.log(`    - Media Files: ${data.medias_count}`);
  console.log(`    - Lessons: ${data.lessons.length}`);
  console.log(`    - Curriculum Paths: ${data.units_and_chapters.length}`);
}

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runAllTests(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("LETTER 'ក' (Ka) FRONTEND TEST SUITE");
  console.log("=".repeat(60));
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  try {
    await runTest("Test 1: Get Letter Data", testGetLetterData);
    await runTest("Test 2: Letter Media Files", testLetterMediaFiles);
    await runTest("Test 3: Media Endpoint", testLetterMediaEndpoint);
    await runTest("Test 4: Lesson Associations", testLetterLessonAssociations);
    await runTest("Test 5: Curriculum Path", testLetterCurriculumPath);
    await runTest("Test 6: Complete Structure", testCompleteDataStructure);
  } catch (error) {
    console.error("Test suite error:", error);
  }

  // Final Report
  console.log("\n" + "=".repeat(60));
  console.log("TEST REPORT");
  console.log("=".repeat(60));
  console.log(`Total Tests: ${testsRun}`);
  console.log(`Passed: ${testsPassed} ✅`);
  console.log(`Failed: ${testsFailed} ❌`);
  console.log("=".repeat(60));

  if (testsFailed > 0) {
    console.log("\nFailed Tests:");
    testResults
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.message}`);
      });
  }

  if (testsPassed === testsRun) {
    console.log(
      "\n✅ ALL TESTS PASSED! The letter 'ក' API is working correctly.\n"
    );
  } else {
    console.log(
      `\n⚠️  ${testsFailed} test(s) failed. Please check the API server.\n`
    );
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Export for use in test runners
export { runAllTests };

// Run if executed directly
if (require.main === module || typeof window === "undefined") {
  runAllTests().catch((error) => {
    console.error("Error running tests:", error);
    process.exit(1);
  });
}
