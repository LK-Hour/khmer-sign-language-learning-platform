import { Locale } from './config';

type Translations = Record<string, string>;

const translations: Record<Locale, Translations> = {
  kh: {
    // Common
    language: 'ភាសា',
    khmer: 'ខ្មែរ',
    english: 'English',
    
    // Navigation
    home: 'ទំព័រដើម',
    navHome: 'ទំព័រដើម',
    navFingerSpelling: 'ការបង្ហាញម្រាមដៃ',
    navWordDetection: 'ការស្គាល់ពាក្យ',
    navDictionary: 'វចនានុក្រម',
    navProfile: 'ប្រវត្តិ',
    navLogout: 'ចាកចេញ',
    logoutConfirmTitle: 'ចាកចេញ?',
    logoutConfirmMessage: 'តើអ្នកប្រាកដថាចង់ចាកចេញមែនទេ?',
    navGuest: 'ភ្ញៀវ',
    navMenu: 'ម៉ឺនុយ',
    navLearningMode: 'មុខងារ',
    navFingerSpellingDesc: 'រៀនអក្សរខ្មែរពីរូបភាពគំរូ',
    navWordDetectionDesc: 'ចាប់ផ្តើមពី ២០ ថ្នាក់ពាក្យជាមួយវីដេអូគំរូ',
    about: 'អំពី',
    contact: 'ទាក់ទង',
    settings: 'ការកំណត់',
    logout: 'ចាកចេញ',
    
    // Auth
    login: 'ចូលប្រើប្រាស់',
    register: 'ចុះឈ្មោះ',
    email: 'អ៊ីមែល',
    password: 'ពាក្យសម្ងាត់',
    confirmPassword: 'បញ្ជាក់ពាក្យសម្ងាត់',
    signIn: 'ចូលប្រើប្រាស់',
    signUp: 'ចុះឈ្មោះ',
    
    // Learning
    lessons: 'មេរៀន',
    alphabet: 'ក្បាលតា',
    fingerSpelling: 'ការបង្ហាញម្រាមដៃ',
    practice: 'លំហាត់',
    quiz: 'សាកល្បង',
    
    // Messages
    welcome: 'សូមស្វាគមន៍',
    success: 'ជោគជ័យ',
    error: 'កំហុស',
    loading: 'កំពុងផ្ទុក...',
    save: 'រក្សាទុក',
    cancel: 'បោះបង់',
    delete: 'លុប',
    edit: 'កែប្រែ',
    
    // Dashboard sections
    dashboard: 'ផ្ទាំងគ្រប់គ្រង',
    myProgress: 'វឌ្ឍនភាពរបស់ខ្ញុំ',
    continueLesson: 'បន្តមេរៀន',
    startLesson: 'ចាប់ផ្តើមមេរៀន',

    // Landing page
    landingEyebrow: 'របៀបរៀន',
    landingTitle: 'បន្តដំណើរការបង្ហាញសញ្ញាខ្មែររបស់អ្នក',
    landingSubtitle:
      'ជ្រើស Finger Spelling ឬ Word Detection រួចបន្តតាមវគ្គ ជំពូក មេរៀន លំហាត់ និងសាកល្បងតាមលំដាប់។',
    landingFingerSpellingCta: 'រៀន Finger Spelling',
    landingWordDetectionCta: 'រៀន Word Detection',
    landingHeroAlt: 'ការតាមដានម្រាមដៃផ្ទាល់សម្រាប់ការរៀនសញ្ញាខ្មែរ',
    landingLiveBadge: 'LIVE',
    landingMode01: 'Mode 01',
    landingMode02: 'Mode 02',
    landingFingerSpellingDesc:
      'រៀនអក្សរខ្មែរនីមួយៗពីរូបភាពគំរូ និងការកែ keypoint ជាមួយពេលវេលាពិតប្រាកដ។',
    landingWordDetectionDesc:
      'ចាប់ផ្តើមពី ២០ ថ្នាក់ពាក្យជាមួយវីដេអូគំរូ និងភាគរយបង្ហាញផ្ទាល់។',
    landingFingerSpellingStat: '១៤/២០ មេរៀន',
    landingWordDetectionStat: '២០ ថ្នាក់ដំបូង',

    // Finger spelling nav
    fsNavHome: 'ទំព័រដើម',
    fsNavExercise: 'លំហាត់',
    fsNavDictionary: 'វចនានុក្រម',
    fsNavProfile: 'ប្រវត្តិ',
    fsHomeTitle: 'អក្សរសញ្ញាដៃខ្មែរ',
    fsHomeSubtitle: 'រៀនអក្សរខ្មែរជាមួយសញ្ញាដៃ',
    fsChapter: 'ជំពូក',
    fsUnit: 'វគ្គ',
    fsLesson: 'មេរៀន',
    fsVowel: 'ស្រៈ',
    fsCharacterLabel: 'អក្សរ',
    fsChapterLockedUntil: 'ចាក់សោរហូតដល់លំហាត់ជំពូក',
    fsChapterLessonsPractice: 'មេរៀន {count} + លំហាត់',
    fsUnitLockedUntil: 'ចាក់សោរហូតដល់វគ្គ',
    fsUnitChapterExercises: 'លំហាត់ {count} ជំពូក',

    // Finger spelling learning
    fsContinue: 'បន្ត',
    fsRetry: 'ព្យាយាមម្តងទៀត',
    fsAccuracy: 'ភាពត្រឹមត្រូវ',
    fsMatchConfidence: 'ភាពជឿជាក់ក្នុងការផ្គូផ្គង',
    fsPredictResult: 'លទ្ធផលព្យាករណ៍',
    fsTip: 'ព័ត៌មានជំនួយ',
    fsPractice: 'ហាត់តាមគំរូ',
    fsCorrectionResult: 'លទ្ធផលកែតម្រូវ',
    fsContinueLesson: 'បន្តមេរៀន',
    fsSampleCaption: 'រូបភាពគំរូសម្រាប់សញ្ញាដៃ',
    fsCameraCaption: 'កាមេរ៉ាអ្នករៀនផ្ទាល់សម្រាប់ប្រៀបធៀបសញ្ញាដៃ',
    fsPressRecToPractice: 'ចុច REC ដើម្បីចាប់ផ្តើមហាត់',
    fsNoHandDetected: 'រកមិនឃើញដៃក្នុងកាមេរ៉ាទេ។ សូមដាក់ដៃឱ្យឃើញច្បាស់។',
    fsPredictionFailed: 'ការព្យាករណ៍បរាជ័យ។ សូមព្យាយាមម្តងទៀត។',
    fsLandmarkerLoading: 'កំពុងផ្ទុកម៉ូឌែល MediaPipe…',
    fsRec: 'REC',
    fsCameraDenied: 'មិនអាចបើកកាមេរ៉ាបានទេ។ សូមអនុញ្ញាតកាមេរ៉ាក្នុងកម្មវិធីរុករក។',
    fsCameraUnavailable: 'កាមេរ៉ាមិនអាចប្រើបាននៅលើឧបករណ៍នេះទេ។',
    fsLessonCompleteTitle: 'ល្អណាស់!!',
    fsLessonCompleteSubtitle: 'អ្នកបានបញ្ចប់មេរៀននេះ។',
    fsNextLesson: 'មេរៀនបន្ទាប់',
    fsRetakeLesson: 'រៀនមេរៀនម្តងទៀត',
    fsBackToChapter: 'ត្រឡប់ទៅជំពូក',
    fsHoldStill: 'សូមកាន់ដៃឱ្យស្ងៀម…',
    fsStableHold: 'ដៃស្ងៀមហើយ!',
    fsGetReady: 'ត្រៀមខ្លួន',
    fsStabilityTimeout: 'សូមដាក់ដៃឱ្យស្ងៀមម្តងទៀត',

    // Finger spelling exercise
    fsExerciseTitle: 'លំហាត់',
    fsCheck: 'ពិនិត្យ',
    fsExerciseCompleteTitle: 'ល្អណាស់!!',
    fsExerciseCompleteSubtitle: 'អ្នកបានបញ្ចប់លំហាត់នេះ។',
    fsBackToPractice: 'ត្រឡប់ទៅលំហាត់',
    fsRetakeExercise: 'ធ្វើលំហាត់ម្តងទៀត',
    fsExerciseSubtitle: 'លំហាត់តាមជំពូក',
    fsExerciseContextTitle: 'ការបង្ហាញម្រាមដៃ',
    fsExerciseContextSubtitle: 'បញ្ចប់មេរៀនដើម្បីបើកលំហាត់',
    fsExerciseHint: 'លំហាត់តាមជំពូកនឹងបើកបន្ទាប់ពីអ្នកបញ្ចប់មេរៀនទាំងអស់ក្នុងជំពូកនោះ។',
    fsExerciseLockedHint: 'បញ្ចប់មេរៀនទាំងអស់ក្នុងជំពូកនេះជាមុនសិន',
    fsExerciseScore: 'ពិន្ទុ {score}/{max}',
    fsDictionaryTitle: 'វចនានុក្រម',
    fsDictionarySubtitle: 'ភាសាសញ្ញាខ្មែរ',
    fsDictionaryComingSoon: 'វចនានុក្រមអក្សរ — នឹងមកដល់ឆាប់ៗនេះ។',
    fsDictionarySearchPlaceholder: 'ស្វែងរក...',
    fsDictionaryFilter: 'តម្រង',
    fsDictionaryNoResults: 'រកមិនឃើញពាក្យ',
    fsDictionaryBack: 'ត្រឡប់ក្រោយ',
    fsProfileTitle: 'ប្រវត្តិរូប',
    fsProfileSubtitle: 'វឌ្ឍនភាពរបស់អ្នក',
    fsProfileComingSoon: 'ប្រវត្តិ និងវឌ្ឍនភាព — នឹងមកដល់ឆាប់ៗនេះ។',
  },
  
  en: {
    // Common
    language: 'Language',
    khmer: 'Khmer',
    english: 'English',
    
    // Navigation
    home: 'Home',
    navHome: 'Home',
    navFingerSpelling: 'Finger Spelling',
    navWordDetection: 'Word Detection',
    navDictionary: 'Dictionary',
    navProfile: 'Profile',
    navLogout: 'Logout',
    logoutConfirmTitle: 'Log out?',
    logoutConfirmMessage: 'Are you sure you want to log out?',
    navGuest: 'Guest',
    navMenu: 'Menu',
    navLearningMode: 'Modes',
    navFingerSpellingDesc: 'Learn each Khmer character from sample images',
    navWordDetectionDesc: 'Start from 20 word classes with video samples',
    about: 'About',
    contact: 'Contact',
    settings: 'Settings',
    logout: 'Logout',
    
    // Auth
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    
    // Learning
    lessons: 'Lessons',
    alphabet: 'Alphabet',
    fingerSpelling: 'Finger Spelling',
    practice: 'Exercise',
    quiz: 'Quiz',
    
    // Messages
    welcome: 'Welcome',
    success: 'Success',
    error: 'Error',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    
    // Dashboard sections
    dashboard: 'Dashboard',
    myProgress: 'My Progress',
    continueLesson: 'Continue Lesson',
    startLesson: 'Start Lesson',

    // Landing page
    landingEyebrow: 'Learner Workspace',
    landingTitle: 'Continue your Khmer signing journey',
    landingSubtitle:
      'Choose Finger Spelling or Word Detection, then continue through units, chapters, lessons, practice, and quizzes in order.',
    landingFingerSpellingCta: 'Learn Finger Spelling',
    landingWordDetectionCta: 'Learn Word Detection',
    landingHeroAlt: 'Live hand tracking preview for Khmer sign learning',
    landingLiveBadge: 'LIVE',
    landingMode01: 'Mode 01',
    landingMode02: 'Mode 02',
    landingFingerSpellingDesc:
      'Learn each Khmer character from sample images and real-time keypoint correction.',
    landingWordDetectionDesc:
      'Start from 20 word classes with video samples and live signing probability.',
    landingFingerSpellingStat: '14/20 lessons',
    landingWordDetectionStat: '20 starter classes',

    // Finger spelling nav
    fsNavHome: 'Home',
    fsNavExercise: 'Exercise',
    fsNavDictionary: 'Dictionary',
    fsNavProfile: 'Profile',
    fsHomeTitle: 'Khmer Finger Spelling',
    fsHomeSubtitle: 'Learn Khmer letters with hand signs',
    fsChapter: 'Chapter',
    fsUnit: 'Unit',
    fsLesson: 'Lesson',
    fsVowel: 'Vowel',
    fsCharacterLabel: 'Character',
    fsChapterLockedUntil: 'Locked until Chapter',
    fsChapterLessonsPractice: '{count} lessons + practice',
    fsUnitLockedUntil: 'Locked until Unit',
    fsUnitChapterExercises: '{count} chapter exercises',

    // Finger spelling learning
    fsContinue: 'Continue',
    fsRetry: 'Retry',
    fsAccuracy: 'Accuracy',
    fsMatchConfidence: 'Match confidence',
    fsPredictResult: 'Predict result',
    fsTip: 'Tip',
    fsPractice: 'Practice with the sample',
    fsCorrectionResult: 'Correction result',
    fsContinueLesson: 'Continue Lesson',
    fsSampleCaption: 'Sample image for the hand sign',
    fsCameraCaption: 'Live learner camera for comparing your hand sign',
    fsPressRecToPractice: 'Wait for for the model Evaluation',
    fsNoHandDetected: 'No hand detected in the camera. Keep your hand clearly visible.',
    fsPredictionFailed: 'Prediction failed. Please try again.',
    fsLandmarkerLoading: 'Loading MediaPipe hand model…',
    fsRec: 'REC',
    fsCameraDenied: 'Could not open the camera. Please allow camera access in your browser.',
    fsCameraUnavailable: 'Camera is not available on this device.',
    fsLessonCompleteTitle: 'Great Job!!',
    fsLessonCompleteSubtitle: "You've completed this lesson.",
    fsNextLesson: 'Next lesson',
    fsRetakeLesson: 'Retake lesson',
    fsBackToChapter: 'Back to chapter',
    fsHoldStill: 'Hold your hand steady…',
    fsStableHold: 'Hand stable!',
    fsGetReady: 'Get ready',
    fsStabilityTimeout: 'Please hold your hand steady again',

    // Finger spelling exercise
    fsExerciseTitle: 'Exercise',
    fsCheck: 'Check',
    fsExerciseCompleteTitle: 'Great Job!!',
    fsExerciseCompleteSubtitle: "You've completed this exercise.",
    fsBackToPractice: 'Back to exercise',
    fsRetakeExercise: 'Retake exercise',
    fsExerciseSubtitle: 'Chapter exercise',
    fsExerciseContextTitle: 'Finger Spelling',
    fsExerciseContextSubtitle: 'Complete lessons to unlock exercises',
    fsExerciseHint:
      'Chapter exercises unlock after you complete every lesson in a chapter.',
    fsExerciseLockedHint: 'Complete all lessons in this chapter first',
    fsExerciseScore: 'Score {score}/{max}',
    fsDictionaryTitle: 'Dictionary',
    fsDictionarySubtitle: 'Khmer sign language',
    fsDictionaryComingSoon: 'Letter dictionary — coming soon.',
    fsDictionarySearchPlaceholder: 'Search...',
    fsDictionaryFilter: 'Filter',
    fsDictionaryNoResults: 'No words found',
    fsDictionaryBack: 'Back',
    fsProfileTitle: 'Profile',
    fsProfileSubtitle: 'Your progress',
    fsProfileComingSoon: 'Profile and progress — coming soon.',
  },
};

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations.kh;
}

export function t(locale: Locale, key: string): string {
  const translations = getTranslations(locale);
  return (translations[key] as string) || key;
}
