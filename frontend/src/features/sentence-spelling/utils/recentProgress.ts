const STORAGE_KEY = "ksl.sentenceSpelling.lastPractice";

export type LastPractice = {
  text: string;
  source: "sample" | "custom";
  completedAt: string;
};

export function getLastPractice(): LastPractice | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<LastPractice>;
    if (!parsed?.text || (parsed.source !== "sample" && parsed.source !== "custom")) {
      return null;
    }

    return { text: parsed.text, source: parsed.source, completedAt: parsed.completedAt ?? "" };
  } catch {
    return null;
  }
}

export function saveLastPractice(entry: Pick<LastPractice, "text" | "source">): void {
  if (typeof window === "undefined") return;

  try {
    const value: LastPractice = { ...entry, completedAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage errors (private browsing, quota, etc.) — this is a nice-to-have.
  }
}
