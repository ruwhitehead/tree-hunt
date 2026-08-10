import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import {
	FLOWER_KEY,
	FLOWERING_COUNT,
	FRUIT_KEY,
	flowerCandidates,
	fruitCandidates,
	keyAvailability,
	keyOrder
} from './content/organs';
import { SPECIES } from './content/species';
import credits from './content/credits.json';

const CONIFERS = SPECIES.filter((s) => s.key === 'needle').map((s) => s.id);

describe('fruit and flower content', () => {
	it('gives every species a fruit, and a kind the key offers', () => {
		const kinds = new Set(FRUIT_KEY.map((k) => k.id));
		for (const s of SPECIES) {
			expect(s.fruit, s.id).toBeTruthy();
			expect(kinds.has(s.fruit.kind), `${s.id}: ${s.fruit.kind}`).toBe(true);
			expect(s.fruit.note.length, s.id).toBeGreaterThan(40);
			expect(s.fruit.months.length, s.id).toBeGreaterThan(0);
		}
	});

	it('gives no conifer a flower, because they have none', () => {
		for (const id of CONIFERS) {
			expect(SPECIES.find((s) => s.id === id)!.flower, `${id} should have no flower`).toBeUndefined();
		}
	});

	it('gives every other species a flower with a kind the key offers', () => {
		const kinds = new Set(FLOWER_KEY.map((k) => k.id));
		for (const s of SPECIES) {
			if (CONIFERS.includes(s.id)) continue;
			expect(s.flower, s.id).toBeTruthy();
			expect(kinds.has(s.flower!.kind), `${s.id}: ${s.flower!.kind}`).toBe(true);
			expect(s.flower!.note.length, s.id).toBeGreaterThan(30);
		}
		expect(FLOWERING_COUNT).toBe(SPECIES.length - CONIFERS.length);
	});

	it('keeps every month index legal', () => {
		for (const s of SPECIES)
			for (const m of [...s.fruit.months, ...(s.flower?.months ?? [])])
				expect(m, s.id).toBeGreaterThanOrEqual(0), expect(m, s.id).toBeLessThanOrEqual(11);
	});

	it('leads every kind somewhere, and accounts for every species', () => {
		for (const k of FRUIT_KEY) expect(fruitCandidates(k.id).length, k.id).toBeGreaterThan(0);
		for (const k of FLOWER_KEY) expect(flowerCandidates(k.id).length, k.id).toBeGreaterThan(0);
		expect(FRUIT_KEY.reduce((n, k) => n + fruitCandidates(k.id).length, 0)).toBe(SPECIES.length);
		expect(FLOWER_KEY.reduce((n, k) => n + flowerCandidates(k.id).length, 0)).toBe(FLOWERING_COUNT);
	});

	it('keeps any one bucket from swallowing the guide', () => {
		for (const k of FRUIT_KEY) expect(fruitCandidates(k.id).length, k.id).toBeLessThan(SPECIES.length / 2);
		for (const k of FLOWER_KEY) expect(flowerCandidates(k.id).length, k.id).toBeLessThan(FLOWERING_COUNT / 2);
	});
});

describe('which key leads today', () => {
	it('always offers at least three keys, in every month', () => {
		for (let m = 0; m < 12; m++) expect(keyOrder(m).length, `month ${m}`).toBeGreaterThanOrEqual(3);
	});

	it('always offers bark and place, which never run out', () => {
		for (let m = 0; m < 12; m++) {
			expect(keyOrder(m), `month ${m}`).toContain('bark');
			expect(keyOrder(m), `month ${m}`).toContain('place');
		}
	});

	it('puts place last in every month — narrowing is not answering', () => {
		for (let m = 0; m < 12; m++) expect(keyOrder(m).at(-1), `month ${m}`).toBe('place');
	});

	it('drops the flower key in the months there are no flowers', () => {
		// August through December: blossom is long over
		for (const m of [7, 8, 9, 10, 11]) expect(keyOrder(m), `month ${m}`).not.toContain('flower');
	});

	it('offers the flower key in spring', () => {
		for (const m of [2, 3, 4]) expect(keyOrder(m), `month ${m}`).toContain('flower');
	});

	it('leads with the leaf key whenever the leaves are actually out', () => {
		for (const m of [4, 5, 6, 7, 8, 9]) expect(keyOrder(m)[0], `month ${m}`).toBe('leaf');
	});

	it('leads with bark in midwinter, which is what bark is for', () => {
		const jan = keyAvailability(0).find((a) => a.id === 'leaf')!;
		const jul = keyAvailability(6).find((a) => a.id === 'leaf')!;
		expect(jan.reach, 'most of the guide is bare in January').toBeLessThan(jul.reach);
		for (const m of [11, 0, 1]) expect(keyOrder(m)[0], `month ${m}`).toBe('bark');
	});

	it('counts larch as bare in winter, needles or not', () => {
		// the one deciduous conifer in the guide, and an easy thing to get wrong
		const evergreens = keyAvailability(0).find((a) => a.id === 'leaf')!.reach;
		expect(evergreens).toBe(
			SPECIES.filter((s) => (s.key === 'needle' && s.id !== 'larch') || ['holly', 'box', 'holm-oak'].includes(s.id)).length
		);
	});
});

describe('fruit and flower photographs', () => {
	const c = credits as Record<string, Record<string, { license: string }>>;
	it('ships a licence credit for every image on disk, and all are CC or public domain', () => {
		for (const s of SPECIES) {
			for (const organ of ['fruit', 'flower'] as const) {
				if (!existsSync(`static/images/species/${s.id}-${organ}.webp`)) continue;
				const lic = c[s.id]?.[organ]?.license;
				expect(lic, `${s.id} ${organ} credit`).toBeTruthy();
				expect(/^cc|public domain/i.test(lic!), `${s.id} ${organ}: ${lic}`).toBe(true);
			}
		}
	});

	it('ships no flower photograph for a conifer', () => {
		for (const id of CONIFERS)
			expect(existsSync(`static/images/species/${id}-flower.webp`), id).toBe(false);
	});
});
