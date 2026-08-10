import type { FlowerKind, FruitKind, Species } from './types';
import { SPECIES } from './species';

/**
 * The fruit and flower keys, and the rule that decides which key Identify leads
 * with today.
 *
 * Bark is available 365 days a year and leaves for about seven months, so those
 * two keys can simply sit there. Fruit and flowers cannot: a flower key is dead
 * weight from July to February, and offering it as though it were equal to the
 * others wastes the reader's time in the months it cannot help. So each species
 * records the months its fruit and flowers are actually findable, and Identify
 * orders its keys by how much of the guide each one can currently reach.
 *
 * This is also the answer to a long-standing note in DESIGN.md — that the app
 * looks identical in February and August despite knowing perfectly well which
 * month it is.
 */

export const FRUIT_KEY: { id: FruitKind; title: string; desc: string }[] = [
	{ id: 'nut', title: 'A nut, acorn or hard case', desc: 'Something you could crack, in a cup, husk or spiny shell' },
	{ id: 'wing', title: 'Winged keys that spin', desc: 'Papery wings that turn as they fall, singly or in pairs' },
	{ id: 'cone', title: 'Cones, or hard hanging balls', desc: 'Woody or leathery, often staying on the tree all winter' },
	{ id: 'berry', title: 'Berries in clusters', desc: 'Soft and brightly coloured, in bunches the birds are after' },
	{ id: 'stone', title: 'One fleshy fruit with a stone', desc: 'A cherry, sloe or small apple, hanging singly or in twos' },
	{ id: 'fluff', title: 'Catkins going to cotton', desc: 'Breaking up into white fluff that drifts across the ground' }
];

export const FLOWER_KEY: { id: FlowerKind; title: string; desc: string }[] = [
	{ id: 'catkin', title: 'Dangling catkins', desc: 'Lambs-tails and tassels hanging loose, usually before the leaves' },
	{ id: 'blossom', title: 'Five-petalled blossom', desc: 'Open white or pink flowers smothering the branch' },
	{ id: 'froth', title: 'Flat frothy creamy plates', desc: 'Hundreds of tiny flowers in a broad flat head' },
	{ id: 'candle', title: 'Upright spikes or candles', desc: 'Held up above the leaves, or hanging in a long spike' },
	{ id: 'small', title: 'Small and easily missed', desc: 'Green, yellow or red tufts you have to go looking for' }
];

export const fruitCandidates = (kind: FruitKind): Species[] =>
	SPECIES.filter((s) => s.fruit.kind === kind);

export const flowerCandidates = (kind: FlowerKind): Species[] =>
	SPECIES.filter((s) => s.flower?.kind === kind);

export const fruitLabel = (k: FruitKind): string => FRUIT_KEY.find((x) => x.id === k)?.title ?? k;
export const flowerLabel = (k: FlowerKind): string =>
	FLOWER_KEY.find((x) => x.id === k)?.title ?? k;

/** Trees with flowers at all. The conifers have none, and a key that pretends
 *  otherwise sends someone hunting for something that does not exist. */
export const FLOWERING_COUNT = SPECIES.filter((s) => s.flower).length;

/**
 * Species with no photograph of that organ, recorded rather than probed so a
 * gap is a decision on the record and not a silent 404. Tests keep both lists
 * honest in both directions.
 *
 * All four are honest absences rather than search failures, and each one is
 * already said in the species' own note:
 *  - leylandii rarely gets the chance to fruit, since it is nearly always clipped
 *  - Lombardy poplar in Britain is a male clone: it never fruits, and Commons
 *    holds no photograph of its catkins either
 *  - ornamental cherry is bred double, so its stamens are petals and it sets
 *    almost nothing
 */
export const FRUIT_PHOTO_MISSING = new Set(['leylandii', 'lombardy-poplar', 'ornamental-cherry']);
export const FLOWER_PHOTO_MISSING = new Set(['lombardy-poplar']);

export function hasOrganPhoto(id: string, organ: 'fruit' | 'flower'): boolean {
	return !(organ === 'fruit' ? FRUIT_PHOTO_MISSING : FLOWER_PHOTO_MISSING).has(id);
}

export type KeyId = 'leaf' | 'bark' | 'fruit' | 'flower' | 'place';

export interface KeyAvailability {
	id: KeyId;
	/** how many of the 50 this key can reach this month */
	reach: number;
	/** 0-1, for ordering */
	share: number;
}

/**
 * How much of the guide each key can actually reach in a given month.
 *
 * Bark and place are always 50 — every tree has both, all year. Leaves are all
 * 50 in summer and only the evergreens in deep winter. Fruit and flowers are
 * counted from the months each species records.
 */
export function keyAvailability(month: number, species: Species[] = SPECIES): KeyAvailability[] {
	const n = species.length;
	// Nov–Mar the broadleaves are bare, so the leaf key reaches only the
	// evergreens: the conifers plus holly, box and holm oak — but NOT larch,
	// which carries needles and drops the lot every autumn.
	const bare = month >= 10 || month <= 2;
	const evergreen = species.filter(
		(s) => (s.key === 'needle' && s.id !== 'larch') || ['holly', 'box', 'holm-oak'].includes(s.id)
	).length;
	const inMonth = (months: number[]) => months.includes(month);

	const rows: KeyAvailability[] = [
		{ id: 'leaf', reach: bare ? evergreen : n, share: 0 },
		{ id: 'fruit', reach: species.filter((s) => inMonth(s.fruit.months)).length, share: 0 },
		{
			id: 'flower',
			reach: species.filter((s) => s.flower && inMonth(s.flower.months)).length,
			share: 0
		},
		{ id: 'bark', reach: n, share: 0 },
		{ id: 'place', reach: n, share: 0 }
	];
	for (const r of rows) r.share = r.reach / n;
	return rows;
}

/**
 * How good each key is when it *does* apply, independent of the season.
 *
 * Reach alone is not enough to order them. Bark and place reach all fifty every
 * day of the year, so on reach alone they would lead every month — and place
 * only ever narrows the field to a handful, which is not the same as answering
 * the question. These weights say how decisive a key is once you can use it: a
 * leaf run through three questions lands on a shortlist, whereas bark asks you
 * to judge a texture and then compare twenty photographs.
 */
const DECISIVENESS: Record<KeyId, number> = {
	leaf: 1,
	fruit: 0.95,
	flower: 0.95,
	bark: 0.6,
	// unused: place is not sorted with the others, see below
	place: 0
};

/**
 * The order Identify presents its keys in today: reach × decisiveness, best
 * first.
 *
 * The weighting is what lets bark lead in midwinter, which is the whole reason
 * the bark key exists. An earlier version pinned bark and place to the end as
 * "last resorts" and a test caught the contradiction — in January the leaf key
 * reaches fourteen evergreens and bark reaches fifty, so calling bark the last
 * resort in the month it is most useful was simply wrong.
 *
 * A key that can reach less than a tenth of the guide is dropped entirely: a
 * flower key in November is not a lesser option, it is a wrong turning.
 *
 * Place is pinned last rather than scored with the rest, because it is not the
 * same kind of thing. The other four look at the tree and answer the question;
 * habitat only narrows fifty candidates to three or four and leaves you to
 * choose. Scoring it alongside them put it above the fruit key in the lean
 * months, which read as nonsense on the page.
 */
export function keyOrder(month: number, species: Species[] = SPECIES): KeyId[] {
	const avail = keyAvailability(month, species);
	const keys = avail
		.filter((a) => a.id !== 'place' && a.share >= 0.1)
		.map((a) => ({ id: a.id, score: a.share * DECISIVENESS[a.id] }))
		.sort((a, b) => b.score - a.score)
		.map((a) => a.id);
	return [...keys, 'place'];
}
