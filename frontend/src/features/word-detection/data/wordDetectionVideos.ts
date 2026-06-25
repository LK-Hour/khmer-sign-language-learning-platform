import { resolveApiAssetUrl } from "@/features/finger-spelling/api/config";

/** Relative repo path to the word-detection development dataset (served at /data_set). */
export const WORD_DETECTION_DATASET_ROOT =
  "data_set/Word_detection for development";

/** Default sample clip per word folder (e.g. `ប៊ិក/ប៊ិក_1.mp4`). */
export const WORD_DETECTION_DEFAULT_SAMPLE_INDEX = 1;

/** Build the dataset-relative path for a word sample video. */
export function getWordDetectionVideoPath(
  word: string,
  sampleIndex: number = WORD_DETECTION_DEFAULT_SAMPLE_INDEX
): string {
  return `${WORD_DETECTION_DATASET_ROOT}/${word}/${word}_${sampleIndex}.mp4`;
}

/** Resolve a browser-loadable URL for a word sample video via the backend static mount. */
export function resolveWordDetectionVideoUrl(
  word: string,
  sampleIndex: number = WORD_DETECTION_DEFAULT_SAMPLE_INDEX
): string {
  const path = getWordDetectionVideoPath(word, sampleIndex);
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return resolveApiAssetUrl(encodedPath) ?? encodedPath;
}
