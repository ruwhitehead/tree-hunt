import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { BARK_KEY, BARK_PHOTO_MISSING, barkCandidates, barkLabel, hasBarkPhoto } from './content/bark';
import { SPECIES } from './content/species';
import credits from './content/credits.json';

describe('bark, the winter half of the key', () => {
	it('every species has a bark note and a texture the key offers', () => {
		const known = new Set(BARK_KEY.map((k) => k.id));
		for (const s of SPECIES) {
			expect(s.bark, s.id).toBeTruthy();
			expect(known.has(s.bark.texture), `${s.id}: ${s.bark.texture}`).toBe(true);
			expect(s.bark.note.length, s.id).toBeGreaterThan(40);
		}
	});

	it('describes bark, not the leaves — the note has to work in February', () => {
		// The whole point of the bark key is that it works when the leaf key cannot,
		// so a note that sends you to the foliage is useless in the month you need
		// it. Scars left BY fallen leaves are a bark feature and stay: they are on
		// the trunk in midwinter, and on a monkey puzzle they are the giveaway.
		for (const s of SPECIES) {
			const needsLivingLeaves = s.bark.note.replace(/scars of fallen leaves|leaf scars/gi, '');
			expect(/leaf|leaves|foliage|blossom/i.test(needsLivingLeaves), `${s.id}: ${s.bark.note}`).toBe(
				false
			);
		}
	});

	it('every texture in the key leads somewhere', () => {
		for (const k of BARK_KEY) {
			expect(barkCandidates(k.id).length, k.id).toBeGreaterThan(0);
		}
	});

	it('accounts for all fifty species across the six textures', () => {
		const total = BARK_KEY.reduce((n, k) => n + barkCandidates(k.id).length, 0);
		expect(total).toBe(SPECIES.length);
	});

	it('keeps any one texture from swallowing the whole guide', () => {
		// a bucket holding most of the guide is not a key, it is a list. Ridged is
		// legitimately the biggest — most mature broadleaves are — but if it ever
		// creeps past half, the taxonomy needs splitting rather than stretching.
		for (const k of BARK_KEY) {
			expect(barkCandidates(k.id).length, k.id).toBeLessThan(SPECIES.length / 2);
		}
	});

	it('names every texture', () => {
		for (const k of BARK_KEY) expect(barkLabel(k.id)).toBe(k.title);
	});
});

describe('bark photographs', () => {
	it('ships a file and a licence credit for every species that claims one', () => {
		const c = credits as Record<string, Record<string, { artist: string; license: string }>>;
		for (const s of SPECIES) {
			if (!hasBarkPhoto(s.id)) continue;
			expect(
				existsSync(`static/images/species/${s.id}-bark.webp`),
				`${s.id}-bark.webp missing`
			).toBe(true);
			expect(existsSync(`static/images/species/${s.id}-bark-480.webp`), `${s.id} 480`).toBe(true);
			expect(c[s.id]?.bark?.license, `${s.id} credit`).toBeTruthy();
		}
	});

	it('ships no file for the ones deliberately left without one', () => {
		// the guard exists so a missing photo is a recorded decision, not a 404
		for (const id of BARK_PHOTO_MISSING) {
			expect(SPECIES.some((s) => s.id === id), `${id} is not a species`).toBe(true);
			expect(existsSync(`static/images/species/${id}-bark.webp`), `${id} unexpectedly has one`).toBe(
				false
			);
		}
	});
});

describe('species ids', () => {
	it('are stable slugs — every image filename and share link is built from one', () => {
		for (const s of SPECIES) expect(s.id).toMatch(/^[a-z][a-z-]*[a-z]$/);
	});
});
