import { browser } from '$app/environment';
import { dateStr } from './streak';
import { speciesById } from './content/species';
import type { Species } from './content/types';

export interface Find {
	id: string;
	date: string;
}

interface Persisted {
	finds: Find[];
	milestones: number[];
	visits: number;
}

const KEY = 'grove-v1';
const MILESTONES = [5, 10];

function load(): Persisted {
	if (!browser) return { finds: [], milestones: [], visits: 0 };
	try {
		const raw = localStorage.getItem(KEY);
		const p = raw ? (JSON.parse(raw) as Partial<Persisted>) : {};
		return {
			finds: p.finds ?? [],
			milestones: p.milestones ?? [],
			visits: p.visits ?? 0
		};
	} catch {
		return { finds: [], milestones: [], visits: 0 };
	}
}

import { SPECIES } from './content/species';
import { install } from './install.svelte';

class Grove {
	finds = $state<Find[]>([]);
	milestones = $state<number[]>([]);
	visits = $state(0);

	/* transient UI state */
	pendingMilestone = $state<number | null>(null);
	/** The species just added, for the deck to play its card coming into colour.
	 *  Deliberately not persisted and cleared on first read: finding a tree is the
	 *  moment worth marking, and reopening the app later is not that moment. */
	justFound = $state<string | null>(null);
	toastMsg = $state<string | null>(null);
	sharePreview = $state<{
		url: string;
		filename: string;
		link: string;
		text: string;
	} | null>(null);

	#toastTimer: ReturnType<typeof setTimeout> | undefined;

	constructor() {
		const p = load();
		this.finds = p.finds;
		this.milestones = p.milestones;
		this.visits = p.visits + 1;
		this.save();
	}

	save() {
		if (!browser) return;
		try {
			localStorage.setItem(
				KEY,
				JSON.stringify({
					finds: this.finds,
					milestones: this.milestones,
					visits: this.visits
				} satisfies Persisted)
			);
		} catch {
			/* storage full or blocked — the session still works in memory */
		}
	}

	get speciesIds(): Set<string> {
		return new Set(this.finds.map((f) => f.id));
	}
	get speciesCount(): number {
		return this.speciesIds.size;
	}
	get co2(): number {
		let total = 0;
		for (const id of this.speciesIds) total += speciesById(id)?.co2 ?? 0;
		return total;
	}
	has(id: string): boolean {
		return this.finds.some((f) => f.id === id);
	}

	/** The date you first met this species. Deliberately the *first* find rather
	 *  than the latest: the deck orders found species by it, and using the latest
	 *  would let a re-sighting shuffle a card you met years ago to the front. */
	firstFound(id: string): string | undefined {
		let earliest: string | undefined;
		for (const f of this.finds) {
			if (f.id !== id) continue;
			if (!earliest || f.date < earliest) earliest = f.date;
		}
		return earliest;
	}

	addFind(id: string) {
		const sp = speciesById(id);
		if (!sp) return;
		this.finds = [...this.finds, { id, date: dateStr(new Date()) }];
		this.justFound = id;
		const count = this.speciesCount;
		if (MILESTONES.includes(count) && !this.milestones.includes(count)) {
			this.milestones = [...this.milestones, count];
			this.pendingMilestone = count;
		}
		this.save();
		this.toast(`${sp.name} added to your Grove 🌿`);
		install.celebrate();
	}

	/** Record seeing a species again, today. Species you met last spring were
	 *  stranded on a summer hunt: the board only counts records dated inside its
	 *  window, and the species page offers "remove" once something is in your
	 *  grove, so there was no way to say "and again, now". Duplicates are safe —
	 *  speciesCount is a Set — and the second date is what a hunt is asking for. */
	logSighting(id: string) {
		const sp = speciesById(id);
		if (!sp) return;
		const seen = this.has(id);
		this.finds = [...this.finds, { id, date: dateStr(new Date()) }];
		if (!seen) {
			this.justFound = id;
			const count = this.speciesCount;
			if (MILESTONES.includes(count) && !this.milestones.includes(count)) {
				this.milestones = [...this.milestones, count];
				this.pendingMilestone = count;
			}
		}
		this.save();
		this.toast(seen ? `${sp.name} — seen again today 🌿` : `${sp.name} added to your Grove 🌿`);
		install.celebrate();
	}

	removeFind(id: string) {
		const sp = speciesById(id);
		this.finds = this.finds.filter((f) => f.id !== id);
		this.save();
		this.toast(`${sp?.name ?? 'Tree'} removed from your grove`);
	}

	toast(msg: string) {
		this.toastMsg = msg;
		clearTimeout(this.#toastTimer);
		this.#toastTimer = setTimeout(() => (this.toastMsg = null), 2600);
	}
}

export const grove = new Grove();

/**
 * The deck split into the two blocks it is drawn in: what you have found, newest
 * meeting first so the last win leads, and what is still out there, left in the
 * order `species.ts` sorts them (by name) so the block stays scannable.
 *
 * Pure, and takes the lookup as an argument, so the ordering can be tested
 * without a browser or a populated store.
 */
export function deckOrder(
	species: Species[],
	metOn: (id: string) => string | undefined
): { found: Species[]; unfound: Species[] } {
	const found: Species[] = [];
	const unfound: Species[] = [];
	for (const s of species) (metOn(s.id) ? found : unfound).push(s);
	found.sort((a, b) => (metOn(b.id) ?? '').localeCompare(metOn(a.id) ?? ''));
	return { found, unfound };
}
