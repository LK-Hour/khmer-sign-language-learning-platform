import type { TranslationKey } from "@/i18n/translations";

/** Map a getUserMedia failure to the message that actually explains it. */
export function cameraErrorKey(err: unknown): TranslationKey {
  const name = err instanceof DOMException ? err.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
    case "PermissionDeniedError":
      return "ERROR.CAMERA_DENIED";
    case "NotFoundError":
    case "OverconstrainedError":
    case "DevicesNotFoundError":
      return "ERROR.CAMERA_NOT_FOUND";
    case "NotReadableError":
    case "AbortError":
    case "TrackStartError":
      return "ERROR.CAMERA_IN_USE";
    default:
      return "ERROR.CAMERA_FAILED";
  }
}
