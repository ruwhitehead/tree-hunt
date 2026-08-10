export type LeafKind = 'needle' | 'simple' | 'lobed' | 'compound';

/**
 * The shape of the whole tree at a distance — nine profiles that cover the
 * guide without anyone needing to know a species to pick one.
 *
 * This drives the silhouette shown for a tree you have not found yet. It
 * replaced a greyed-out photograph, which was a colour signal and therefore
 * vanished entirely in forced-colours mode, where CSS filters are dropped. A
 * silhouette drawn in `currentColor` survives that, and unlike a desaturated
 * photograph it actually teaches something: crown shape is how you name a tree
 * across a field, and it is one of the few features readable in winter.
 */
export type CrownShape =
	| 'spreading'
	| 'domed'
	| 'arching'
	| 'columnar'
	| 'conical'
	| 'flat-topped'
	| 'weeping'
	| 'vase'
	| 'shrubby';

/**
 * How the bark reads at arm's length on a mature trunk.
 *
 * Six buckets, chosen because a beginner can genuinely tell them apart from a
 * couple of paces away without knowing a single species. Botanical accuracy
 * would want more of them; a key nobody can answer is worth nothing.
 *
 * This matters more than it looks. The leaf key is useless from November to
 * April, which is half the year, and bark is what is left.
 */
export type BarkTexture = 'smooth' | 'peeling' | 'banded' | 'ridged' | 'flaking' | 'fibrous';

export interface Bark {
	texture: BarkTexture;
	/** what you see and feel at chest height on a MATURE trunk */
	note: string;
	/** only where the young tree differs enough to send you to the wrong answer */
	young?: string;
}

/**
 * What the tree is carrying, sorted by what it looks like rather than by what a
 * botanist would call it. A conifer cone and a plane's bobble are not the same
 * organ; they are the same thing to someone holding one.
 */
export type FruitKind = 'nut' | 'wing' | 'cone' | 'berry' | 'stone' | 'fluff';

/**
 * Flowers, likewise by appearance. Note this is optional on a species: the
 * conifers have no flowers at all, and a key that pretends otherwise is lying.
 */
export type FlowerKind = 'catkin' | 'blossom' | 'froth' | 'candle' | 'small';

/**
 * A seasonal organ. Unlike bark, which is there every day of the year, fruit
 * and flowers are only findable for part of it — so each carries the months it
 * can actually be seen, and Identify uses them to lead with the key that works
 * today. `months` is 0-11 and may wrap the new year.
 */
export interface Seasonal<Kind> {
	kind: Kind;
	/** what you are looking at, in a sentence or two */
	note: string;
	/** months it is findable, 0 = January */
	months: number[];
}

export interface Species {
	id: string;
	name: string;
	latin: string;
	/** other names people actually use — also searched in Learn */
	aka?: string[];
	family: string;
	/** rough annual CO2 absorption for a mature specimen, kg/yr */
	co2: number;
	/** two gradient stops for the leaf motif where no photo is shown */
	colors: [string, string];
	key: LeafKind;
	key2: string;
	/** the profile at a distance, drawn as the silhouette for a tree not yet found */
	crown: CrownShape;
	/** one-line distinguishing hint shown in key candidates */
	hint: string;
	/** at-a-glance reference rows: height, lifespan, status, where it grows */
	quick: [label: string, value: string][];
	/** how to be sure — each entry is a full identification note */
	spot: string[];
	/** the winter half of identification: what the trunk tells you */
	bark: Bark;
	/** what it is carrying, and when. Every tree fruits, even if barely */
	fruit: Seasonal<FruitKind>;
	/** absent on the conifers, which have no flowers — the key says so */
	flower?: Seasonal<FlowerKind>;
	/** what to look for right now, by season */
	season: [season: string, note: string][];
	folklore: [title: string, body: string][];
	science: [title: string, body: string][];
	/** "one to tell" — a fact written to be repeated aloud */
	tell: string;
}
