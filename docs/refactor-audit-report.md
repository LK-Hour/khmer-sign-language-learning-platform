# Frontend Codebase Audit Report

Date: 2026-06-13
Project: Khmer Sign Language Platform frontend
Stack: Next.js 16.2.6, React 19.2.4, MUI 9.0.1, Zustand 5.x, TypeScript 5.x, Framer Motion 12.x, MediaPipe Tasks Vision 0.10.21, notistack 3.x

## Progress Update: 2026-06-14

### 1. Dead Code Cleanup

- Kept the unused component folders by request:
  - `frontend/src/components/custom-popover`
  - `frontend/src/components/empty-content`
  - `frontend/src/components/scrollbar`
- Replaced the root default Next.js starter page with a redirect to the default locale.
- Fixed `frontend/src/app/[locale]/loading.tsx` so it returns `PageSkeleton`.
- Removed unused files:
  - `frontend/src/providers/ReactQueryProvider.tsx`
  - `frontend/src/theme/ThemeRegistry.tsx`
  - `frontend/src/store/app.store.ts`
  - `frontend/src/features/finger-spelling/api/client.ts`
  - `frontend/src/features/dictionary/api/client.ts`
- Removed the unused `@tanstack/react-query` dependency from `frontend/package.json`.
- Removed unused mock constants/config:
  - `FS_USE_MOCK`
  - `FS_MOCK_ACCURACY`
  - `FS_MOCK_DELAY_MS`
  - `NEXT_PUBLIC_FS_USE_MOCK` from the finger-spelling README.
- Added `npm run typecheck`, which runs `next typegen && tsc --noEmit`.
- Verification after cleanup: `npm run lint` passes and `npm run typecheck` passes.

### 2. Component Organization

Completed behavior-preserving component ownership moves:

- Moved auth UI:
  - `frontend/src/components/Login/LoginView.tsx`
  - to `frontend/src/features/auth/components/LoginView.tsx`
- Moved quiz UI:
  - `frontend/src/components/quiz/*`
  - to `frontend/src/features/quiz/components/*`
- Moved finger-spelling domain components:
  - `frontend/src/components/curriculum/CurriculumCard.tsx`
  - to `frontend/src/features/finger-spelling/components/curriculum/CurriculumCard.tsx`
  - `frontend/src/components/common/ProgressLabel.tsx`
  - to `frontend/src/features/finger-spelling/components/common/ProgressLabel.tsx`
  - `frontend/src/components/common/StartExerciseLink.tsx`
  - to `frontend/src/features/finger-spelling/components/common/StartExerciseLink.tsx`
- Added feature barrels:
  - `frontend/src/features/auth/components/index.ts`
  - `frontend/src/features/quiz/components/index.ts`
  - `frontend/src/features/finger-spelling/components/common/index.ts`
  - `frontend/src/features/finger-spelling/components/curriculum/index.ts`
- Updated the login route to import from `@/features/auth/components`.
- Verification after component organization: `npm run lint` passes and `npm run typecheck` passes.

### 3. Large Files

Completed first large-file split batch:

- Split `LessonPracticeStep.tsx`:
  - extracted `PracticeInfoCards.tsx`
  - extracted `PracticeFeedbackPanel.tsx`
  - extracted `useAnimatedScore.ts`
  - reduced `LessonPracticeStep.tsx` from 436 lines to 266 lines.
- Split `useHandLandmarker.ts`:
  - extracted `useStabilityDetector.ts`
  - reduced `useHandLandmarker.ts` from 418 lines to 265 lines.
- Split `fingerSpelling.store.ts`:
  - extracted pure track helpers into `trackState.ts`
  - extracted selectors into `selectors.ts`
  - reduced `fingerSpelling.store.ts` from 362 lines to 274 lines.
- Verification after large-file split batch: `npm run lint` passes and `npm run typecheck` passes.
- Remaining files over 300 lines:
  - `frontend/src/features/auth/components/LoginView.tsx`
  - `frontend/src/components/layout/header-nav/MainHeader.tsx`
  - `frontend/src/features/finger-spelling/components/FingerSpellingTrack.tsx`
  - `frontend/src/features/admin/quiz/AdminQuizManager.tsx`
  - `frontend/src/i18n/translations.ts`

### 4. Naming Issues

Completed behavior-preserving naming cleanup:

- Renamed landing card:
  - `LandingModeCard.tsx` -> `LearningModeCard.tsx`
  - `LandingModeCard` -> `LearningModeCard`
- Renamed finger-spelling layout/track components:
  - `FingerSpellingShell.tsx` -> `FingerSpellingPageLayout.tsx`
  - `FingerSpellingDictionaryShell.tsx` -> `FingerSpellingDictionaryLayout.tsx`
  - `FingerSpellingTrack.tsx` -> `FingerSpellingTrackContainer.tsx`
  - `FingerSpellingTrackView.tsx` -> `FingerSpellingTrack.tsx`
- Renamed finger-spelling common components:
  - `ProgressLabel.tsx` -> `CompletionText.tsx`
  - `StartExerciseLink.tsx` -> `ExerciseStartButtonLink.tsx`
- Renamed quiz generic components:
  - `OptionButton.tsx` -> `QuizOptionButton.tsx`
  - `ResultCard.tsx` -> `QuizResultCard.tsx`
- Exported `PageSkeletonVariant` from `PageSkeleton.tsx` so loading skeleton variants are reusable as a type.
- Updated barrels and route imports to use the new names.
- Verification after naming cleanup: `npm run lint` passes and `npm run typecheck` passes.

### 5. MUI v9 Issues

Completed first theme/provider cleanup:

- Verified active source does not use deprecated MUI APIs from the audit list:
  - no `<Hidden />`
  - no `makeStyles`
  - no `createMuiTheme`
  - no `withStyles`
  - no deprecated `InputProps`, `inputProps`, or `componentsProps` matches
- Confirmed the app uses `AppRouterCacheProvider` from `@mui/material-nextjs/v16-appRouter`.
- Kept backward-compatible `KslColors` aliases, but separated canonical color names from legacy aliases:
  - prefer `surface`
  - prefer `textPrimary`
  - prefer `textSecondary`
- Expanded `KslFontSizes` from `sm/md/lg` to a broader token scale:
  - `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`
- Converted `KslLineHeights` from pixel strings to unitless typography ratios.
- Aligned MUI theme background with the app background:
  - `theme.palette.background.default` now uses `KslPalette.neutral.background`
  - `ThemeStylesProvider` now reads global background from the active MUI theme instead of importing `KslColors`
- Verification after MUI cleanup: `npm run lint` passes and `npm run typecheck` passes.

Remaining MUI/styling cleanup:

- Gradually replace legacy `KslColors.card`, `KslColors.text`, `KslColors.typography`, and `KslColors.muted` usages with canonical names.
- Continue moving repeated raw sizes/colors in large components toward theme variants or shared UI components.
- Keep `sx` as the default local styling API; reserve `styled()` for reusable wrappers and third-party integrations.

### 6. Next.js 16 Issues

Completed framework-level cleanup:

- Added root route fallbacks:
  - `frontend/src/app/error.tsx`
  - `frontend/src/app/not-found.tsx`
- Added localized route fallbacks:
  - `frontend/src/app/[locale]/error.tsx`
  - `frontend/src/app/[locale]/not-found.tsx`
- Confirmed `frontend/src/proxy.ts` is valid for the installed Next.js version:
  - local Next internals recognize both `/src/middleware` and `/src/proxy`
  - no rename to `middleware.ts` was needed
- Tightened image config in `frontend/next.config.ts`:
  - localhost and `127.0.0.1` image patterns are included only in development
  - `dangerouslyAllowLocalIP` remains development-only
  - production keeps only the public HTTPS image host
- Previously completed items still hold:
  - root `frontend/src/app/page.tsx` redirects to the default locale
  - `npm run typecheck` regenerates Next route types before running TypeScript
- Verification after Next.js cleanup: `npm run lint` passes and `npm run typecheck` passes.

Remaining Next.js cleanup:

- Add feature-specific `error.tsx` / `not-found.tsx` only where the UI needs a custom recovery experience.
- Consider `generateStaticParams` later if routes become statically generated; current API-driven pages can remain dynamic.

### 7. State Management Issues

Completed low-risk store cleanup:

- Added token-expiry support to `frontend/src/store/auth.store.ts`:
  - persists `tokenExpiresAt`
  - supports common backend fields `expires_at` and `expires_in`
  - falls back to decoding JWT `exp` when present
  - clears expired persisted auth during store rehydration
- Updated `frontend/src/utils/api/client.ts` to clear expired auth before attaching a stored bearer token.
- Removed the duplicate i18n store shim:
  - deleted `frontend/src/i18n/localeStore.ts`
  - `frontend/src/i18n/index.ts` now re-exports `useLocaleStore` from `@/store/locale.store`
  - updated live imports and README examples to use the canonical public i18n export
- Previously completed items still hold:
  - `frontend/src/store/app.store.ts` was removed
  - React Query provider/dependency was removed because no active code used it
- Verification after state cleanup: `npm run lint` passes and `npm run typecheck` passes.

Completed deeper state cleanup:

- Moved finger-spelling practice/session/prediction API effects out of Zustand:
  - added `frontend/src/features/finger-spelling/hooks/useFingerSpellingPracticeActions.ts`
  - `fingerSpelling.store.ts` now keeps UI/session state setters and pure progress updates
  - `LessonLearningView.tsx` calls the hook for async work
- Verified `fingerSpelling.store.ts` no longer imports feature API modules.

Remaining state cleanup:

- Decide whether persisted finger-spelling expansion state should remain persisted or reset per curriculum version.

### 9. i18n Issues

Completed custom i18n safety cleanup:

- Moved translation copy out of `translations.ts` into JSON files:
  - `frontend/src/i18n/locales/en.json`
  - `frontend/src/i18n/locales/kh.json`
- `translations.ts` is now a typed loader/interpolator for the JSON files.
- Verified EN/KH locale files have matching key sets:
  - `en`: 189 keys
  - `kh`: 189 keys
- Added typed translation keys:
  - exported `TranslationKey`
  - `useTranslation().t` now accepts only known translation keys
- Added interpolation support to `t(locale, key, values)`.
- Updated finger-spelling chapter count copy to use interpolation:
  - `t("fsChapterLessonsPractice", { count: chapter.lessonCount })`
- Fixed a bad header translation key:
  - `t("Login")` -> `t("login")`
- Replaced hard-coded route fallback copy with translation keys:
  - root `error.tsx`
  - localized `error.tsx`
  - root `not-found.tsx`
  - localized `not-found.tsx`
- Replaced hard-coded finger-spelling track/practice copy with translation keys.
- Replaced admin quiz manager labels, buttons, placeholders, and validation messages with translation keys.
- Kept the custom i18n system for now to avoid introducing a new package mid-refactor.
- Verification after i18n cleanup: `npm run lint` passes and `npm run typecheck` passes.

Remaining i18n cleanup:

- Move remaining auth/login copy into translation JSON.
- Split JSON files by namespace if the locale files keep growing.
- Add pluralization rules later if Khmer/English copy needs grammar-aware counts.

### 10. Styling Issues

Completed first styling consistency cleanup:

- Removed active-source usage of legacy color aliases:
  - no `KslColors.card`
  - no `KslColors.text`
  - no `KslColors.typography`
  - no `KslColors.muted`
- Replaced selected raw font sizes in recently refactored components with `KslFontSizes` tokens.
- Replaced selected raw soft backgrounds with palette tokens:
  - `KslColors.primaryLighter`
- Centralized admin dashboard styling tokens in `AdminQuizManager.tsx`:
  - local admin palette
  - repeated small typography values
  - table heading style object
- Added route-level skeleton wrappers in `PageSkeleton.tsx`:
  - `ListPageSkeleton`
  - `DictionaryPageSkeleton`
  - `DetailPageSkeleton`
  - `LessonPageSkeleton`
  - `ProfilePageSkeleton`
- Updated route loading files to use skeleton wrappers instead of passing variant strings directly.
- Aligned `globals.css` design variables with `theme.ts`.
- Kept `sx` as the default local styling API.
- Verification after styling cleanup: `npm run lint` passes and `npm run typecheck` passes.

Remaining styling cleanup:

- Several image/link elements still use small inline `style` props for `objectFit`, `objectPosition`, and text-decoration; convert only where it improves consistency without fighting Next/Image or Link ergonomics.

## Verification

Files reviewed: every `.ts` and `.tsx` file under `frontend/src` excluding `node_modules` and `.next`.

Commands used:

```bash
find frontend/src -type f \( -name '*.ts' -o -name '*.tsx' \) | sort
find frontend/src -type f \( -name '*.ts' -o -name '*.tsx' \) -print0 | xargs -0 wc -l | sort -nr
rg -n "custom-popover|empty-content|scrollbar|ThemeRegistry|useAppStore|ReactQueryProvider|useQuery|useMutation|fsFetch|dictFetch" frontend/src
npm run lint
npm run typecheck
```

Current verification after the first cleanup slice:

- `npm run lint` passes with no warnings.
- `npm run typecheck` passes. It runs `next typegen` before `tsc --noEmit`, which prevents stale generated route types from breaking TypeScript checks.

Original audit note: `npx tsc --noEmit` failed before cleanup because `.next/types/validator.ts` referenced deleted route files. The new `typecheck` script addresses this workflow problem.

## 1. Dead Code

### `frontend/src/app/page.tsx`

Issue: default Next.js starter page is still present. It renders `next.svg`, "To get started, edit the page.tsx file.", Vercel deploy buttons, and documentation links.

Evidence:

- `frontend/src/app/page.tsx:1-106`
- Actual localized home lives in `frontend/src/app/[locale]/page.tsx:1-5`.
- `frontend/src/proxy.ts:52-88` redirects unlocalized paths to a locale path.

Recommended fix: replace root page with `redirect(\`/${DEFAULT_LOCALE}\`)` or render the same landing page intentionally. Remove unused starter assets if no longer needed.

### `frontend/src/app/loading.tsx` and `frontend/src/app/[locale]/loading.tsx`

Issue: root loading returns `PageSkeleton`, but locale loading imports it and returns nothing.

Evidence:

- `frontend/src/app/loading.tsx:1-5`
- `frontend/src/app/[locale]/loading.tsx:1-5`

Recommended fix: either return `<PageSkeleton variant="list" />` in both places or remove the unused locale loading component.

### Unused component folders

These folders are not imported outside themselves:

- `frontend/src/components/custom-popover`
- `frontend/src/components/empty-content`
- `frontend/src/components/scrollbar`

Evidence:

- `rg` only finds local exports/internal imports for these folders.
- No app/feature file imports them.

Recommended fix: delete them if no planned use exists. If they are kept as a UI library starter, move them behind a documented `components/ui` convention and add real usage.

### `frontend/src/theme/ThemeRegistry.tsx`

Issue: pass-through wrapper around `ThemeStylesProvider`, unused by the app.

Evidence:

- `frontend/src/theme/ThemeRegistry.tsx:1-9`
- `frontend/src/providers/AppProviders.tsx` imports `ThemeStylesProvider` directly.

Recommended fix: delete `ThemeRegistry.tsx`.

### `frontend/src/store/app.store.ts`

Issue: `useMock` state is unused.

Evidence:

- `frontend/src/store/app.store.ts:1-11`
- `rg "useAppStore|useMock" frontend/src` only finds this file.

Recommended fix: delete the store or replace scattered mock flags with one explicit runtime config.

### React Query provider currently has no consumers

Issue: TanStack Query is configured but no source file uses `useQuery` or `useMutation`.

Evidence:

- `frontend/src/providers/ReactQueryProvider.tsx:1-26`
- `frontend/src/providers/AppProviders.tsx:14-16`
- `rg "useQuery|useMutation" frontend/src` returns no component usage.

Recommended fix: either remove `ReactQueryProvider` until needed or migrate server/client API state to React Query in the data refactor.

### Pass-through API wrappers

Issue: feature API clients only call `apiFetch` and add no behavior.

Evidence:

- `frontend/src/features/finger-spelling/api/client.ts:1-8`
- `frontend/src/features/dictionary/api/client.ts:1-8`

Recommended fix: delete `fsFetch` and `dictFetch` or make them add real feature behavior such as endpoint prefixing, typed errors, or feature-specific headers.

### Mock remnants

Issue: mock-related constants and config remain in live modules.

Evidence:

- `frontend/src/features/finger-spelling/store/types.ts:184-186` exports `FS_PASS_THRESHOLD`, `FS_MOCK_ACCURACY`, and `FS_MOCK_DELAY_MS`.
- `frontend/src/features/finger-spelling/api/config.ts:187-188` exports `FS_USE_MOCK = false`.
- `frontend/src/features/finger-spelling/README.md:240-243` still documents `NEXT_PUBLIC_FS_USE_MOCK=false`.
- `frontend/src/features/dictionary/api/config.ts:1-2` defaults dictionary to mock mode unless `NEXT_PUBLIC_DICT_USE_MOCK === "false"`.

Recommended fix: move mock data and mock flags to `features/<feature>/mocks` or test-only setup. Keep production API config clean.

## 2. Component Organization

Current `src/components` shape:

- `components/ui`: atomic components. This is the strongest convention in the folder.
- `components/layout`: app shell components. Mostly appropriate, but `header-nav/MainHeader.tsx` is too large.
- `components/common`: only `ProgressLabel.tsx` and `StartExerciseLink.tsx`; name is too vague.
- `components/Login`: feature-specific auth UI in the generic component tree.
- `components/quiz`: feature-specific quiz UI in the generic component tree.
- `components/curriculum`: one orphaned feature-specific component.
- `components/custom-dialog`, `custom-popover`, `empty-content`, `scrollbar`, `snackbar`, `iconify`: template/wrapper-style folders with mixed usage.

Recommended moves:

| Current Path                                              | Recommended Path                                                                                 | Reason                                       |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `frontend/src/components/Login/LoginView.tsx`           | `frontend/src/features/auth/components/LoginView.tsx`                                          | Auth feature UI.                             |
| `frontend/src/components/quiz/*`                        | `frontend/src/features/quiz/components/*` or `frontend/src/features/admin/quiz/components/*` | Quiz domain UI.                              |
| `frontend/src/components/curriculum/CurriculumCard.tsx` | `frontend/src/features/finger-spelling/components` or future `features/curriculum`           | Domain card, not shared UI.                  |
| `frontend/src/components/common/StartExerciseLink.tsx`  | Feature-specific component folder or remove wrapper                                              | Thin wrapper around `PrimaryActionButton`. |
| `frontend/src/components/common/ProgressLabel.tsx`      | Feature-specific component folder or rename to `CompletionText`                                | Domain-specific completion display.          |
| `frontend/src/components/custom-popover`                | Delete or `components/ui/popover`                                                              | Unused template code.                        |
| `frontend/src/components/empty-content`                 | Delete or `components/ui/EmptyState`                                                           | Unused template code.                        |
| `frontend/src/components/scrollbar`                     | Delete or `components/ui/Scrollbar`                                                            | Unused template code.                        |

Recommended rule:

- `components/ui`: app-wide primitives only.
- `components/layout`: app shell only.
- `features/<feature>`: all feature UI, hooks, API, mocks, and utils.
- `store`: app-wide state only.

## 3. Large Files

Files over 300 lines:

| File                                                                                 | Lines | Recommended Extraction                                                                                                                                                                                |
| ------------------------------------------------------------------------------------ | ----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/components/Login/LoginView.tsx`                                      |  1233 | `AuthWelcomePanel`, `WorkspaceTabs`, `LearnerLoginForm`, `AdminLoginForm`, `SocialLoginButtons`, `useGoogleLogin`, `useFacebookLogin`, `useTelegramLogin`, `parseTelegramCallback`. |
| `frontend/src/components/layout/header-nav/MainHeader.tsx`                         |   836 | `HeaderBrand`, `DesktopNav`, `MobileNavDrawer`, `LocaleMenu`, `ProfileLogoutBlock`, `LogoutConfirmDialog`, `useHeaderNavigation`.                                                       |
| `frontend/src/features/finger-spelling/components/FingerSpellingTrackView.tsx`     |   662 | `TrackSummaryCard`, `NumberBadge`, `UnitTrackCard`, `ChapterTrackSection`, `LessonTrackRow`.                                                                                                |
| `frontend/src/features/admin/quiz/AdminQuizManager.tsx`                            |   637 | `AdminQuizSidebar`, `AdminQuizTable`, `AdminQuizForm`, `QuestionTypeIcon`, `typeLabel`, `typeChipStyles`.                                                                                 |
| `frontend/src/features/finger-spelling/components/learning/LessonPracticeStep.tsx` |   436 | `TipCard`, `MetricCard`, `PracticeFeedbackPanel`, `useAnimatedScore`.                                                                                                                         |
| `frontend/src/features/finger-spelling/ml/useHandLandmarker.ts`                    |   418 | `loadHandLandmarker`, `canvasFrame`, `contrastEnhancement`, `useHandLandmarker`, `useStabilityDetector`.                                                                                    |
| `frontend/src/features/finger-spelling/store/fingerSpelling.store.ts`              |   362 | `trackProgressMerge`, `trackSelectors`, `practiceSessionActions` or move async actions to hooks.                                                                                                |
| `frontend/src/i18n/translations.ts`                                                |   309 | Split by namespace:`auth`, `navigation`, `fingerSpelling`, `dictionary`, `common`.                                                                                                          |

Specific evidence:

- `LoginView.tsx:188-212` injects Telegram widget script.
- `LoginView.tsx:338-380` loads Google and Facebook SDK scripts.
- `LoginView.tsx:499-1233` defines many subcomponents inline.
- `MainHeader.tsx:250-353` owns nav state and handlers.
- `MainHeader.tsx:355-570` renders desktop nav.
- `MainHeader.tsx:572-789` renders mobile drawer.
- `FingerSpellingTrackView.tsx:182-662` defines all track subcomponents inline.
- `useHandLandmarker.ts:22-37` loads MediaPipe singleton.
- `useHandLandmarker.ts:117-265` handles extraction and overlay detection.
- `useHandLandmarker.ts:281-418` defines stability detection.

## 4. Naming Issues

Recommended renames:

| Current Name                      | Recommended Name                                               | Reason                                                           |
| --------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| `StartExerciseLink`             | `ExerciseStartButtonLink` or remove wrapper                  | It is a button-link wrapper, not a workflow.                     |
| `ProgressLabel`                 | `CompletionText` or `ProgressText`                         | It renders simple completion text.                               |
| `LandingModeCard`               | `LearningModeCard`                                           | The card represents a learning mode, not landing-page ownership. |
| `FingerSpellingShell`           | `FingerSpellingPageLayout`                                   | Clarifies layout responsibility.                                 |
| `FingerSpellingDictionaryShell` | `DictionaryPageLayout` or `FingerSpellingDictionaryLayout` | "Shell" is vague.                                                |
| `FingerSpellingTrack`           | `FingerSpellingTrackContainer`                               | It hydrates store state.                                         |
| `FingerSpellingTrackView`       | `FingerSpellingTrack`                                        | It renders the track UI.                                         |
| `OptionButton`                  | `QuizOptionButton`                                           | Avoids generic UI name.                                          |
| `ResultCard`                    | `QuizResultCard`                                             | Avoids generic UI name.                                          |
| `fsFetch`                       | Delete or `fingerSpellingApiFetch`                           | Current name hides that it is a pass-through.                    |
| `dictFetch`                     | Delete or `dictionaryApiFetch`                               | Current name hides that it is a pass-through.                    |

File naming inconsistency:

- PascalCase: `AppLayout.tsx`, `LoginView.tsx`, `MainHeader.tsx`.
- camelCase hooks/utilities: `useHandLandmarker.ts`, `useTranslation.ts`, `localizedText.ts`.
- kebab-case template files: `confirm-dialog.tsx`, `custom-popover.tsx`, `empty-content.tsx`.

Recommended convention:

- Components: PascalCase files.
- Hooks: camelCase starting with `use`.
- Pure utilities: camelCase.
- Route files: Next.js required names.
- Remove or rename template kebab-case components if retained.

Type naming:

- `FsTrackUnit` and `FsTrackChapter` are extended shapes, but "Track" is ambiguous.
- `FsProgressStatus` string literals `"NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"` should be centralized as constants if used across API/store/UI.

## 5. MUI v9 Issues

Correct usage found:

- `frontend/src/providers/ThemeStylesProvider.tsx:222-270` uses `@mui/material-nextjs/v16-appRouter` and `AppRouterCacheProvider`.
- `frontend/src/components/layout/ResponsiveHidden.tsx` replaces deprecated MUI `<Hidden />`.
- Grid usage uses the v9 `size` prop in reviewed files.
- `slotProps` is used in several places, including `LoginView.tsx:945`, `DictionarySearchBar.tsx:36`, and `MainHeader.tsx:577`.

Issues:

### Token duplication and unclear palette usage

Evidence:

- `frontend/src/theme/theme.ts:4-33` defines `KslPalette`.
- `frontend/src/theme/theme.ts:35-62` defines `KslColors`.
- `KslColors.surface` and `KslColors.card` both map to `KslPalette.neutral.card`.
- `KslColors.text`, `KslColors.typography`, and `KslColors.textPrimary` all map to the same value.

Recommended fix: keep one source of truth. Prefer MUI theme tokens plus a smaller app token object only when MUI cannot express the design.

### Incomplete text scale

Evidence:

- `frontend/src/theme/theme.ts:81-86` only defines `sm`, `md`, and `lg`.
- Components still use raw sizes such as `12`, `13`, `30`, `32`, `36`, and `42`.

Recommended fix: expand typography variants in `theme.ts` and use semantic MUI variants instead of raw numbers.

### Line heights bypass MUI convention

Evidence:

- `frontend/src/theme/theme.ts:88-92` uses string values like `"20px"`.

Recommended fix: use MUI typography variants consistently. If line heights remain tokens, document whether they are CSS lengths or unitless typography ratios.

### Conflicting backgrounds

Evidence:

- `frontend/src/theme/theme.ts:107-109` sets `background.default` to `#ffffff`.
- `frontend/src/providers/ThemeStylesProvider.tsx:241-248` sets `:root`, `html`, and `body` background to `KslColors.background`.

Recommended fix: align `theme.palette.background.default` with the global page background or remove duplicated global background declarations.

### Mixed styling approaches

Evidence:

- Most app components use `sx`.
- Template wrappers use `styled()`, for example `components/snackbar/styles.ts` and `components/custom-popover/styles.tsx`.
- Some components use inline `style`, such as link wrappers and media elements.

Recommended fix: define a rule: use `sx` for local layout, theme variants for repeated component styles, and `styled()` only for reusable wrappers or third-party component integration.

## 6. Next.js 16 Issues

Correct usage found:

- Async params pattern appears in route files, for example `frontend/src/app/[locale]/layout.tsx` and `frontend/src/app/[locale]/finger-spelling/lessons/[lessonId]/page.tsx`.
- Client components use `"use client"` where browser APIs, Zustand, or event handlers are needed.
- `frontend/src/proxy.ts` exports `proxy` and `config`. For Next.js 16 this is not automatically a bug; verify against the project's Next.js file convention before renaming to `middleware.ts`.

Issues:

### Missing route error boundaries

Status: fixed at the root and localized route levels.

Added files:

- `frontend/src/app/error.tsx`
- `frontend/src/app/not-found.tsx`
- `frontend/src/app/[locale]/error.tsx`
- `frontend/src/app/[locale]/not-found.tsx`

Remaining recommendation: add feature-specific boundaries only when a route needs custom recovery copy or actions.

### Root route still contains scaffold UI

Status: fixed during dead-code cleanup.

Current behavior:

- `frontend/src/app/page.tsx` redirects to `/${DEFAULT_LOCALE}`.

### Generated route types are stale

Status: fixed by the typecheck workflow.

Current behavior:

- `npm run typecheck` runs `next typegen && tsc --noEmit`.

### `next.config.ts` should clarify dev-only image behavior

Status: fixed.

Current behavior:

- `frontend/next.config.ts` only includes localhost and `127.0.0.1` remote image patterns in development.
- `dangerouslyAllowLocalIP` is still enabled only in development.
- Production keeps the public HTTPS image host.

## 7. State Management Issues

### `auth.store.ts`

Status: fixed.

Current behavior:

- `frontend/src/store/auth.store.ts` persists `tokenExpiresAt`.
- Auth expiry is resolved from `expires_at`, `expires_in`, or JWT `exp`.
- Expired persisted auth is cleared during rehydration and before `apiFetch` attaches a stored token.

### `locale.store.ts`

Status: fixed.

Current behavior:

- `frontend/src/i18n/localeStore.ts` was removed.
- Public i18n usage imports `useLocaleStore` from `@/i18n`.
- Store internals can import from `@/store/locale.store`.

### `app.store.ts`

Status: fixed.

Current behavior:

- `frontend/src/store/app.store.ts` was deleted.

### `fingerSpelling.store.ts`

Status: fixed for practice/session/prediction effects.

Current behavior:

- `frontend/src/features/finger-spelling/store/fingerSpelling.store.ts` no longer imports feature API modules.
- Async practice/session/prediction work now lives in `frontend/src/features/finger-spelling/hooks/useFingerSpellingPracticeActions.ts`.
- Zustand keeps UI/session state setters, pure progress updates, and persisted expansion state.

Remaining recommendation: decide whether persisted expansion state should be versioned or reset when curriculum data changes substantially.

### React Query is configured but unused

Status: fixed.

Current behavior: React Query provider and dependency were removed because no active code used React Query hooks.

## 8. API Layer Issues

### Duplicate base URL definitions

Evidence:

- `frontend/src/utils/api/client.ts` defines `baseURL`.
- `frontend/src/features/finger-spelling/api/config.ts:189-191` defines `API_BASE_URL`.
- `frontend/src/features/dictionary/api/config.ts:4` re-exports `API_BASE_URL` from finger-spelling config.

Recommended fix: create one app API config module, for example `src/utils/api/config.ts`.

### API client is coupled to Zustand

Evidence:

- `frontend/src/utils/api/client.ts:1` imports `useAuthStore`.
- It reads `useAuthStore.getState().token` inside `apiFetch`.

Recommended fix: inject token getter and unauthorized handler, or keep auth coupling in a thin browser-only client wrapper.

### Thin feature wrappers add no value

Evidence:

- `frontend/src/features/finger-spelling/api/client.ts:3-8`
- `frontend/src/features/dictionary/api/client.ts:3-8`

Recommended fix: remove or make them real feature clients.

### Inconsistent error handling

Examples:

- `fetchFsUnit`, `fetchFsChapter`, and `fetchFsLesson` catch all errors and return `null`.
- `apiFetch` throws `ApiError` without backend response details.
- `fingerSpelling.store.ts` silently ignores practice submission/end failures.

Recommended fix: standardize error handling:

- API functions should either throw typed errors or return explicit result objects.
- Route loaders should decide when to call `notFound`, show recoverable UI, or log.
- `ApiError` should parse `detail`/body where possible.

## 9. i18n Issues

### Custom translation system is too thin

Status: partially fixed.

Current behavior:

- Translation copy lives in `frontend/src/i18n/locales/en.json` and `frontend/src/i18n/locales/kh.json`.
- `frontend/src/i18n/translations.ts` exports `TranslationKey`.
- `useTranslation().t` accepts typed keys.
- `t(locale, key, values)` supports simple `{name}` interpolation.
- EN/KH JSON key sets were checked and match.

Remaining gaps:

- Pluralization.
- Namespaces.
- Missing-key reporting.
- Deeper namespace splitting if JSON files continue growing.

### Hard-coded strings remain in components

Examples:

- `LoginView.tsx`: auth copy, social button text, errors.
- `MainHeader.tsx`: brand copy and aria labels.
- Admin and finger-spelling track/practice copy were moved into JSON in the latest pass.

Recommended fix: continue with auth/login copy next, then group translation keys by feature namespace if the JSON files become hard to scan.

### `useLocalizedPair` adds little value

Evidence:

- `frontend/src/i18n/useLocalizedPair.ts` only wraps `getLocalizedPair` with locale lookup.

Recommended fix: keep only if it improves component readability; otherwise use `getLocalizedPair(locale, en, kh)` directly.

## 10. Styling Issues

### Raw values are scattered in `sx`

Examples:

- `LoginView.tsx:103-118` defines a local color object.
- `MainHeader.tsx:54-121` defines nav/dropdown styles locally.
- `FingerSpellingTrackView.tsx` repeats card, row, badge, and progress styles.
- `LessonPracticeStep.tsx` repeats metric and feedback card styles.

Recommended fix: move repeated styles to theme variants or reusable UI components.

### `PageSkeleton` variants are stringly typed in usage

Status: fixed for route usage.

Current behavior:

- `PageSkeletonVariant` remains exported.
- `PageSkeleton.tsx` now exports route-level wrappers such as `ListPageSkeleton`, `DictionaryPageSkeleton`, `DetailPageSkeleton`, and `LessonPageSkeleton`.
- Loading route files use the wrappers instead of passing string variants.

### Local style maps compete with theme tokens

Evidence:

- `LoginView.tsx:103-118` local `colors`.
- `theme.ts` already has `KslPalette` and `KslColors`.

Recommended fix: remove local color maps unless they are component-private semantic tokens.

## 11. Priority Refactor List

### P0: Critical Cleanup

1. Fix type-check workflow by cleaning stale `.next` generated route types and adding a `typecheck` script.
2. Replace `frontend/src/app/page.tsx` default starter page.
3. Fix `frontend/src/app/[locale]/loading.tsx` to return a skeleton or remove it.
4. Fix lint warnings in `MainHeader.tsx` and `LocaleFlag.tsx`.
5. Delete confirmed dead code:
   - `components/custom-popover`
   - `components/empty-content`
   - `components/scrollbar`
   - `theme/ThemeRegistry.tsx`
   - `store/app.store.ts`
6. Decide whether to keep `ReactQueryProvider`; if kept, start migrating server/client API state to React Query.

### P1: Structural Refactor

1. Create a frontend architecture note defining folder ownership.
2. Move `LoginView` to `features/auth/components`.
3. Move quiz components to `features/quiz` or `features/admin/quiz/components`.
4. Move or delete orphaned `components/curriculum/CurriculumCard.tsx`.
5. Split `LoginView.tsx`.
6. Split `MainHeader.tsx`.
7. Split `FingerSpellingTrackView.tsx`.
8. Split `LessonPracticeStep.tsx`.
9. Split `useHandLandmarker.ts`.
10. Move async practice/session/prediction actions out of Zustand.

### P2: Cleanup And Consistency

1. Consolidate API base URL configuration.
2. Remove `fsFetch` and `dictFetch` pass-through wrappers or give them real feature behavior.
3. Separate mock data from live API modules.
4. Add app and route-level `error.tsx`/`not-found.tsx`.
5. Normalize file naming conventions.
6. Expand or simplify design tokens.
7. Move hard-coded strings into i18n.
8. Split `translations.ts` by namespace or adopt a fuller i18n library.

## Recommended Target Structure

```text
frontend/src
  app/
  components/
    layout/
    ui/
    feedback/
  features/
    auth/
      api/
      components/
      hooks/
      utils/
      types.ts
    dictionary/
      api/
      components/
      mocks/
      server/
      types.ts
    finger-spelling/
      api/
      components/
        learning/
        track/
      hooks/
      ml/
      server/
      store/
      types/
      utils/
    quiz/
      components/
      types.ts
    admin/
      quiz/
        components/
        mocks/
        types.ts
  i18n/
  providers/
  store/
  theme/
  utils/
```

## Bottom Line

The codebase is refactorable without a rewrite. The biggest risks are not Next.js or MUI version incompatibility; they are mixed responsibilities, dead scaffold/template code, unreliable type-checking due to stale generated files, feature-specific components living in shared folders, and stores/API modules doing too much. Start with P0 cleanup, then move files by ownership before splitting behavior-heavy components.
