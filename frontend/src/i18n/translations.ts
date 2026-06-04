import { Locale } from './config';

type Translations = Record<string, string | Record<string, string>>;

const translations: Record<Locale, Translations> = {
  kh: {
    // Common
    language: 'ភាសា',
    khmer: 'ខ្មែរ',
    english: 'English',
    
    // Navigation
    home: 'ទំព័រដើម',
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

    // Finger spelling nav
    fsNavHome: 'ទំព័រដើម',
    fsNavExercise: 'លំហាត់',
    fsNavDictionary: 'វចនានុក្រម',
    fsNavProfile: 'ប្រវត្តិ',
    fsHomeTitle: 'អក្សរសញ្ញាដៃខ្មែរ',
    fsHomeSubtitle: 'រៀនអក្សរខ្មែរជាមួយសញ្ញាដៃ',
    fsChapter: 'ជំពូក',
    fsUnit: 'វគ្គ',
    fsChapterLockedUntil: 'ចាក់សោរហូតដល់លំហាត់ជំពូក',
    fsChapterLessonsPractice: 'មេរៀន {count} + លំហាត់',
    fsUnitLockedUntil: 'ចាក់សោរហូតដល់វគ្គ',
    fsUnitChapterExercises: 'លំហាត់ {count} ជំពូក',

    // Finger spelling learning
    fsContinue: 'បន្ត',
    fsRetry: 'ព្យាយាមម្តងទៀត',
    fsAccuracy: 'ភាពត្រឹមត្រូវ',
    fsRec: 'REC',
    fsCameraDenied: 'មិនអាចបើកកាមេរ៉ាបានទេ។ សូមអនុញ្ញាតកាមេរ៉ាក្នុងកម្មវិធីរុករក។',
    fsCameraUnavailable: 'កាមេរ៉ាមិនអាចប្រើបាននៅលើឧបករណ៍នេះទេ។',
    fsLessonCompleteTitle: 'ល្អណាស់!!',
    fsLessonCompleteSubtitle: 'អ្នកបានបញ្ចប់មេរៀននេះ។',
    fsNextLesson: 'មេរៀនបន្ទាប់',
    fsRetakeLesson: 'រៀនមេរៀនម្តងទៀត',
    fsBackToChapter: 'ត្រឡប់ទៅជំពូក',

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

    // Finger spelling nav
    fsNavHome: 'Home',
    fsNavExercise: 'Exercise',
    fsNavDictionary: 'Dictionary',
    fsNavProfile: 'Profile',
    fsHomeTitle: 'Khmer Finger Spelling',
    fsHomeSubtitle: 'Learn Khmer letters with hand signs',
    fsChapter: 'Chapter',
    fsUnit: 'Unit',
    fsChapterLockedUntil: 'Locked until Chapter',
    fsChapterLessonsPractice: '{count} lessons + practice',
    fsUnitLockedUntil: 'Locked until Unit',
    fsUnitChapterExercises: '{count} chapter exercises',

    // Finger spelling learning
    fsContinue: 'Continue',
    fsRetry: 'Retry',
    fsAccuracy: 'Accuracy',
    fsRec: 'REC',
    fsCameraDenied: 'Could not open the camera. Please allow camera access in your browser.',
    fsCameraUnavailable: 'Camera is not available on this device.',
    fsLessonCompleteTitle: 'Great Job!!',
    fsLessonCompleteSubtitle: "You've completed this lesson.",
    fsNextLesson: 'Next lesson',
    fsRetakeLesson: 'Retake lesson',
    fsBackToChapter: 'Back to chapter',

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
