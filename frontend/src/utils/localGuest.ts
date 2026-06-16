const LOCAL_GUEST_ID_KEY = "ksl-local-guest-id";

function createGuestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `guest_${crypto.randomUUID()}`;
  }
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateLocalGuestId(): string {
  if (typeof window === "undefined") {
    return "guest_ssr";
  }

  const existing = window.localStorage.getItem(LOCAL_GUEST_ID_KEY);
  if (existing) return existing;

  const guestId = createGuestId();
  window.localStorage.setItem(LOCAL_GUEST_ID_KEY, guestId);
  return guestId;
}
