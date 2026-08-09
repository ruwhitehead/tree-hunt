/**
 * A way out for the trees people were following.
 *
 * Following an individual tree through the year is gone. That feature held the
 * only thing in this app someone could actually lose: dated observations they
 * typed, and photographs they took. Everything else here is a list of species
 * ids that can be rebuilt in an afternoon's walk.
 *
 * So the code goes and the data stays. Nothing in this module writes or
 * deletes; it reads the old records out of localStorage and the old photos out
 * of IndexedDB and hands them back as one file. The stores are left exactly
 * where they are, so someone who reinstalls, or comes back in six months, can
 * still get their photographs. A later release can clear them, once the export
 * has been available long enough to be fair.
 *
 * Photos are inlined as data URLs rather than zipped. It makes the file large,
 * but it makes it one file and one click, and there is no archive library in
 * this project to add for a farewell.
 */

const RECORDS_KEY = 'mat-trees-v1';
const DB = 'meet-a-tree';
const STORE = 'photos';

interface LegacyObservation {
	id: string;
	event: string;
	date: string;
	note?: string;
	photoKey?: string;
	submitted?: boolean;
}

export interface LegacyTree {
	id: string;
	speciesId: string;
	name: string;
	place?: string;
	postcode?: string;
	planted: string;
	observations: LegacyObservation[];
}

export function legacyTrees(): LegacyTree[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const raw = localStorage.getItem(RECORDS_KEY);
		const parsed = raw ? (JSON.parse(raw) as LegacyTree[]) : [];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export function legacyObservationCount(trees = legacyTrees()): number {
	return trees.reduce((n, t) => n + (t.observations?.length ?? 0), 0);
}

/** Read-only: opens at the existing version and never upgrades, so calling this
 *  on a device that never had the feature cannot create the store. */
async function readPhotos(keys: string[]): Promise<Record<string, string>> {
	if (typeof indexedDB === 'undefined' || !keys.length) return {};
	let db: IDBDatabase;
	try {
		db = await new Promise<IDBDatabase>((resolve, reject) => {
			const req = indexedDB.open(DB);
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
			req.onblocked = () => reject(new Error('blocked'));
		});
	} catch {
		return {};
	}
	if (!db.objectStoreNames.contains(STORE)) {
		db.close();
		return {};
	}
	const out: Record<string, string> = {};
	try {
		const tx = db.transaction(STORE, 'readonly');
		const store = tx.objectStore(STORE);
		for (const key of keys) {
			const blob = await new Promise<Blob | undefined>((resolve) => {
				const req = store.get(key);
				req.onsuccess = () => resolve(req.result as Blob | undefined);
				req.onerror = () => resolve(undefined);
			});
			if (!blob) continue;
			out[key] = await new Promise<string>((resolve) => {
				const fr = new FileReader();
				fr.onload = () => resolve(String(fr.result));
				fr.onerror = () => resolve('');
				fr.readAsDataURL(blob);
			});
		}
	} catch {
		/* a partial export beats none */
	}
	db.close();
	return out;
}

export async function buildLegacyExport(): Promise<string> {
	const trees = legacyTrees();
	const keys = trees.flatMap((t) => t.observations?.map((o) => o.photoKey) ?? []).filter(Boolean);
	const photos = await readPhotos(keys as string[]);
	return JSON.stringify(
		{
			exportedBy: 'Meet a Tree',
			about:
				'The trees you were following, with every dated note and photograph. Photos are data URLs: paste one into a browser address bar to view it, or open this file with any JSON tool.',
			trees,
			photos
		},
		null,
		'\t'
	);
}

export async function downloadLegacyExport(filename = 'my-trees.json'): Promise<void> {
	const json = await buildLegacyExport();
	const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	// give the download a moment to start before the URL stops resolving
	setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
