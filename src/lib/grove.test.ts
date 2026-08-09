import { describe, expect, it } from 'vitest';
import { deckOrder } from './grove.svelte';
import { SPECIES } from './content/species';
import type { Species } from './content/types';

const sp = (id: string, name = id) => ({ id, name }) as Species;

describe('the deck, split into found and still to find', () => {
	it('puts every found species ahead of every unfound one', () => {
		const met: Record<string, string> = { b: '2026-01-01' };
		const { found, unfound } = deckOrder([sp('a'), sp('b'), sp('c')], (id) => met[id]);
		expect(found.map((s) => s.id)).toEqual(['b']);
		expect(unfound.map((s) => s.id)).toEqual(['a', 'c']);
	});

	it('leads with the most recent meeting, so the last win is visible', () => {
		const met: Record<string, string> = {
			old: '2024-03-02',
			newest: '2026-08-08',
			middle: '2026-01-19'
		};
		const { found } = deckOrder([sp('old'), sp('middle'), sp('newest')], (id) => met[id]);
		expect(found.map((s) => s.id)).toEqual(['newest', 'middle', 'old']);
	});

	it('leaves the still-to-find block in the order it was given', () => {
		// species.ts already sorts by name, so the block stays alphabetical and
		// someone can scan it for the tree they have just seen
		const { unfound } = deckOrder(SPECIES, () => undefined);
		const names = unfound.map((s) => s.name);
		expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
	});

	it('accounts for every species exactly once', () => {
		const met: Record<string, string> = { oak: '2026-05-05', holly: '2026-06-06' };
		const { found, unfound } = deckOrder(SPECIES, (id) => met[id]);
		expect(found.length + unfound.length).toBe(SPECIES.length);
		expect(new Set([...found, ...unfound].map((s) => s.id)).size).toBe(SPECIES.length);
	});

	it('copes with an empty grove and with a complete one', () => {
		expect(deckOrder(SPECIES, () => undefined).found).toHaveLength(0);
		expect(deckOrder(SPECIES, () => '2026-01-01').unfound).toHaveLength(0);
	});
});

describe('when you first met a species', () => {
	it('reports the earliest find, so a re-sighting cannot reshuffle the deck', async () => {
		const { grove } = await import('./grove.svelte');
		grove.finds = [
			{ id: 'oak', date: '2026-08-08' },
			{ id: 'oak', date: '2025-04-01' },
			{ id: 'holly', date: '2026-02-02' }
		];
		expect(grove.firstFound('oak')).toBe('2025-04-01');
		expect(grove.firstFound('holly')).toBe('2026-02-02');
	});

	it('is undefined for a species you have never met', async () => {
		const { grove } = await import('./grove.svelte');
		grove.finds = [];
		expect(grove.firstFound('oak')).toBeUndefined();
	});
});
