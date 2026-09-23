/**
 * The lesson URL must not render a locked lesson, for real accounts and for
 * local-only guests (whose unlock state exists only in the browser).
 *
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LocaleContextProvider } from "@/i18n/locale-context";
import { useAuthStore } from "@/store/auth.store";
import type { FsTrackUnit } from "../../store/types";
import { useGuestProgressStore } from "../../store/guestProgress.store";
import FingerSpellingLessonAccessGuard from "./FingerSpellingLessonAccessGuard";

const { replaceMock, fetchFsTreeMock } = vi.hoisted(() => {
  // The persisted stores read `localStorage` when they are created (import
  // time), and Node's own `localStorage` global is unusable under jsdom.
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, String(value)),
      removeItem: (key: string) => void data.delete(key),
      clear: () => data.clear(),
    },
  });
  return { replaceMock: vi.fn(), fetchFsTreeMock: vi.fn() };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock("@/features/finger-spelling/api/curriculum", () => ({
  fetchFsTree: fetchFsTreeMock,
}));

function lesson(id: number, isLocked: boolean) {
  return {
    id,
    chapterId: 1,
    letterId: id,
    letter: "ក",
    imageUrl: "",
    orderIndex: id,
    isLocked,
    progressStatus: "NOT_STARTED",
  };
}

function treeOf(lessons: ReturnType<typeof lesson>[]): FsTrackUnit[] {
  return [
    {
      id: 1,
      orderIndex: 1,
      chapterCount: 1,
      completedLessonCount: 0,
      totalLessonCount: lessons.length,
      isLocked: false,
      chapters: [
        {
          id: 1,
          unitId: 1,
          orderIndex: 1,
          lessonCount: lessons.length,
          completedLessonCount: 0,
          isLocked: false,
          isPracticeComplete: false,
          lessons,
        },
      ],
    },
  ] as unknown as FsTrackUnit[];
}

const account = {
  id: "user-1",
  email: "student@example.com",
  first_name: "Student",
  last_name: null,
  picture: null,
  provider: "email",
  account_type: "student",
};

function signInAsStudent() {
  useAuthStore.setState({
    hasHydrated: true,
    isRefreshing: false,
    token: "access-token",
    user: account,
    isAuthenticated: true,
  });
}

function signInAsGuest(completedLessonIds: number[]) {
  useAuthStore.setState({
    hasHydrated: true,
    isRefreshing: false,
    token: null,
    user: { ...account, id: "guest_1", provider: "guest", is_guest: true },
    isAuthenticated: true,
  });
  const now = new Date().toISOString();
  useGuestProgressStore.setState({
    lessons: Object.fromEntries(
      completedLessonIds.map((id) => [
        id,
        { lessonId: id, isCompleted: true, attemptCount: 1, completedAt: now, lastPracticedAt: now },
      ])
    ),
  });
}

function renderGuard(lessonId: number) {
  return render(
    <LocaleContextProvider value="en">
      <FingerSpellingLessonAccessGuard
        lessonId={lessonId}
        fallback={<div data-testid="fallback" />}
      >
        <div data-testid="lesson-view" />
      </FingerSpellingLessonAccessGuard>
    </LocaleContextProvider>
  );
}

describe("FingerSpellingLessonAccessGuard", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    fetchFsTreeMock.mockReset();
    useGuestProgressStore.setState({ lessons: {} });
    signInAsStudent();
  });

  it("renders the lesson when the server says it is unlocked", async () => {
    fetchFsTreeMock.mockResolvedValue(treeOf([lesson(1, false), lesson(2, false)]));
    renderGuard(2);

    expect(await screen.findByTestId("lesson-view")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redirects to the track and never renders a locked lesson", async () => {
    fetchFsTreeMock.mockResolvedValue(treeOf([lesson(1, false), lesson(30, true)]));
    renderGuard(30);

    expect(screen.getByTestId("fallback")).toBeInTheDocument();
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/en/finger-spelling"));
    expect(screen.queryByTestId("lesson-view")).not.toBeInTheDocument();
  });

  it("redirects when the lesson is not in the curriculum tree", async () => {
    fetchFsTreeMock.mockResolvedValue(treeOf([lesson(1, false)]));
    renderGuard(999);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/en/finger-spelling"));
    expect(screen.queryByTestId("lesson-view")).not.toBeInTheDocument();
  });

  it("shows an error and hides the lesson when the tree cannot be loaded", async () => {
    fetchFsTreeMock.mockRejectedValue(new Error("network"));
    renderGuard(2);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByTestId("lesson-view")).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("does not fetch or render anything until auth has hydrated", () => {
    useAuthStore.setState({ hasHydrated: false });
    renderGuard(2);

    expect(fetchFsTreeMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("lesson-view")).not.toBeInTheDocument();
  });

  it("unlocks the next guest lesson from local progress although the server tree is anonymous", async () => {
    signInAsGuest([1]);
    fetchFsTreeMock.mockResolvedValue(treeOf([lesson(1, false), lesson(2, true), lesson(3, true)]));
    renderGuard(2);

    expect(await screen.findByTestId("lesson-view")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redirects a guest from a lesson beyond their local progress", async () => {
    signInAsGuest([1]);
    fetchFsTreeMock.mockResolvedValue(treeOf([lesson(1, false), lesson(2, true), lesson(3, true)]));
    renderGuard(3);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/en/finger-spelling"));
    expect(screen.queryByTestId("lesson-view")).not.toBeInTheDocument();
  });
});
