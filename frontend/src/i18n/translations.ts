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
    practice: 'ការហាត់ប្រាណ',
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
    practice: 'Practice',
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
  },
};

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations.kh;
}

export function t(locale: Locale, key: string): string {
  const translations = getTranslations(locale);
  return (translations[key] as string) || key;
}
