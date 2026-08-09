import { browser } from '$app/environment';

/**
 * Removes what the retired "follow a tree through the year" feature left behind.
 *
 * That feature stored dated observations in localStorage and photographs as
 * blobs in IndexedDB. It briefly shipped with an export, on the principle that
 * you do not delete things people made. The owner's call, with the app still
 * unreleased and the feature unused, is that nobody made anything — so the
 * offer was noise and the leftovers are just megabytes of orphaned blobs
 * sitting in strangers' browsers with no code left that can read them.
 *
 * Deliberately unconditional and unflagged. Both calls are no-ops when there is
 * nothing there, neither blocks, and skipping the flag means no new key is left
 * behind in place of the ones being cleared. `deleteDatabase` only stalls on an
 * open connection, and nothing opens this one any more.
 */
const RECORDS_KEY = 'mat-trees-v1';
const PHOTO_DB = 'meet-a-tree';

export function clearLegacyData(): void {
	if (!browser) return;
	try {
		localStorage.removeItem(RECORDS_KEY);
	} catch {
		/* storage blocked entirely; nothing to clear either */
	}
	try {
		indexedDB?.deleteDatabase?.(PHOTO_DB);
	} catch {
		/* older or locked-down browsers; the orphan is invisible and harmless */
	}
}
