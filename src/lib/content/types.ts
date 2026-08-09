export type LeafKind = 'needle' | 'simple' | 'lobed' | 'compound';

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
	/** one-line distinguishing hint shown in key candidates */
	hint: string;
	/** at-a-glance reference rows: height, lifespan, status, where it grows */
	quick: [label: string, value: string][];
	/** how to be sure — each entry is a full identification note */
	spot: string[];
	/** the winter half of identification: what the trunk tells you */
	bark: Bark;
	/** what to look for right now, by season */
	season: [season: string, note: string][];
	folklore: [title: string, body: string][];
	science: [title: string, body: string][];
	/** "one to tell" — a fact written to be repeated aloud */
	tell: string;
}
