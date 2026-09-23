import { mapApiError } from "../hooks/useEntityForm";

/**
 * Runs the publish call that follows a successful save.
 *
 * Saving always leaves the row as a draft and publishing is a separate request, so when
 * publish is rejected (e.g. the parent isn't published yet) the row *is* saved. Rewording
 * the error says so, instead of making it look like the whole save failed.
 */
export async function publishAfterSave<T>(publish: () => Promise<T>): Promise<T> {
  try {
    return await publish();
  } catch (error) {
    throw new Error(`Saved as a draft, but it could not be published. ${mapApiError(error)}`);
  }
}
