import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import FeedbackRoundedIcon from "@mui/icons-material/FeedbackRounded";
import type { NavSectionConfig, NavTreeNodeConfig } from "./navTypes";

// Re-export types so existing imports from "./navConfig" continue to work
export type { NavSectionConfig, NavTreeNodeConfig } from "./navTypes";

/**
 * @deprecated Use `NavTreeNodeConfig` from `./navTypes` instead.
 * Kept for backward compatibility with the old NavItem component until it's fully removed.
 */
export interface NavItemConfig {
  title: string;
  path: string;
  icon: React.ElementType;
  children?: NavItemConfig[];
}

export const NAV_CONFIG: NavSectionConfig[] = [
  {
    title: "ADMIN.NAV_SECTION_DASHBOARD",
    items: [
      {
        id: "analytics",
        title: "ADMIN.NAV_ANALYTICS",
        icon: BarChartRoundedIcon,
        path: "/admin/analytics",
      },
    ],
  },
  {
    title: "ADMIN.NAV_SECTION_LEARNING",
    items: [
      {
        id: "learning-mgmt",
        title: "ADMIN.NAV_LEARNING_MANAGEMENT",
        icon: SchoolRoundedIcon,
        children: [
          {
            id: "finger-spelling",
            title: "ADMIN.NAV_FINGER_SPELLING",
            children: [
              { id: "fs-units", title: "ADMIN.NAV_UNITS", path: "/admin/learning/finger-spelling/units" },
              { id: "fs-chapters", title: "ADMIN.NAV_CHAPTERS", path: "/admin/learning/finger-spelling/chapters" },
              { id: "fs-lessons", title: "ADMIN.NAV_LESSONS", path: "/admin/learning/finger-spelling/lessons" },
            ],
          },
          {
            id: "word-detection",
            title: "ADMIN.NAV_WORD_DETECTION",
            children: [
              { id: "wd-units", title: "ADMIN.NAV_UNITS", path: "/admin/learning/word-detection/units" },
              { id: "wd-chapters", title: "ADMIN.NAV_CHAPTERS", path: "/admin/learning/word-detection/chapters" },
              { id: "wd-lessons", title: "ADMIN.NAV_LESSONS", path: "/admin/learning/word-detection/lessons" },
            ],
          },
          {
            id: "data-contribution",
            title: "ADMIN.NAV_DATA_CONTRIBUTION",
            dynamic: "contribution-tree",
          },
          {
            id: "unit-quiz",
            title: "ADMIN.NAV_UNIT_QUIZ",
            children: [
              { id: "quiz-fs", title: "ADMIN.NAV_FINGER_SPELLING", dynamic: "quiz-finger" },
              { id: "quiz-wd", title: "ADMIN.NAV_WORD_DETECTION", dynamic: "quiz-word" },
            ],
          },
        ],
      },
      {
        id: "dictionary",
        title: "ADMIN.NAV_DICTIONARY",
        icon: MenuBookRoundedIcon,
        children: [
          { id: "dict-chars", title: "ADMIN.NAV_CHARACTERS", path: "/admin/dictionary/characters" },
          { id: "dict-words", title: "ADMIN.NAV_WORDS", path: "/admin/dictionary/words" },
        ],
      },
    ],
  },
  {
    title: "ADMIN.NAV_SECTION_MANAGEMENT",
    items: [
      {
        id: "users",
        title: "ADMIN.NAV_USERS",
        icon: PeopleRoundedIcon,
        children: [
          { id: "users-admin", title: "ADMIN.NAV_ADMIN", path: "/admin/users/admin" },
          { id: "users-student", title: "ADMIN.NAV_STUDENT", path: "/admin/users/student" },
        ],
      },
      {
        id: "media-library",
        title: "ADMIN.NAV_MEDIA_LIBRARY",
        icon: PhotoLibraryRoundedIcon,
        children: [
          { id: "media-images", title: "ADMIN.NAV_IMAGES", path: "/admin/media/images" },
          { id: "media-videos", title: "ADMIN.NAV_VIDEOS", path: "/admin/media/videos" },
        ],
      },
      {
        id: "feedback",
        title: "ADMIN.NAV_FEEDBACK",
        icon: FeedbackRoundedIcon,
        path: "/admin/feedback",
      },
    ],
  },
];
