import { SPECIES, speciesById } from './content/species';
import type { Species } from './content/types';
import { hasBarkPhoto } from './content/bark';
import { seasonOfMonth } from './season';

/**
 * The quiz, generated from the guide rather than written alongside it.
 *
 * Every species already carries a hint, spotting notes, bark, folklore,
 * science, a seasonal calendar, a "one to tell" and four photographs. That is
 * enough for hundreds of questions with no new content to keep in step - and
 * content that drifts out of step with the guide is worse than no quiz.
 *
 * Two things here are correctness, not polish, and both have tests:
 *
 *  1. REDACTION. The prose names its own species constantly - oak's folklore
 *     opens "The oak was sacred to the thunder gods" - so a passage used as a
 *     prompt would hand over the answer. Where a passage has sentences that
 *     never name the tree those are preferred, because they read naturally;
 *     otherwise every name, Latin name, alias and bare common noun is replaced.
 *
 *  2. CONFUSABLE PAIRS. The guide contains near-duplicates on purpose. English
 *     and sessile oak share a bark note that says outright that bark will not
 *     separate them. Offering both in one question produces a question with two
 *     defensible answers, and being marked wrong for a right answer is the
 *     fastest way to lose someone's trust. So no two members of a confusable
 *     group ever appear in the same question.
 */

/* ------------------------------------------------------------------ randomness */

/** mulberry32. Seeded, because the codebase avoids bare Math.random and because
 *  a round that cannot be reproduced cannot be tested or shared. */
export function rng(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function seedFrom(text: string): number {
	let h = 2166136261;
	for (let i = 0; i < text.length; i++) {
		h ^= text.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

function shuffle<T>(items: T[], rand: () => number): T[] {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/* ------------------------------------------------------------------ confusables */

/** Groups the guide deliberately holds more than one of. Never split across the
 *  options of a single question. */
export const CONFUSABLE: string[][] = [
	['oak', 'sessile-oak', 'holm-oak'],
	['birch', 'downy-birch'],
	['hawthorn', 'blackthorn'],
	['lime', 'common-lime'],
	['black-poplar', 'lombardy-poplar', 'aspen'],
	['white-willow', 'crack-willow', 'weeping-willow', 'goat-willow'],
	['wild-cherry', 'bird-cherry', 'ornamental-cherry'],
	['sycamore', 'norway-maple', 'field-maple'],
	['spruce', 'sitka-spruce'],
	['rowan', 'whitebeam', 'wild-service'],
	['chestnut', 'sweet-chestnut'],
	['yew', 'juniper', 'leylandii'],
	['pine', 'larch', 'douglas-fir', 'cedar-of-lebanon']
];

const groupOf = new Map<string, number>();
CONFUSABLE.forEach((group, i) => group.forEach((id) => groupOf.set(id, i)));

export function areConfusable(a: string, b: string): boolean {
	if (a === b) return false;
	const ga = groupOf.get(a);
	return ga !== undefined && ga === groupOf.get(b);
}

/* ------------------------------------------------------------------ redaction */

/** Words too generic to strip: removing them would mangle the sentence without
 *  giving anything away, since every entry here is a tree. */
const TOO_GENERIC = new Set(['tree', 'common', 'wild', 'english', 'giant', 'weeping']);

/** Every string that would identify this species if it survived into a prompt. */
export function tellingTerms(sp: Species): string[] {
	const terms = new Set<string>();
	const add = (t: string) => {
		const v = t.trim();
		if (v.length > 2 && !TOO_GENERIC.has(v.toLowerCase())) terms.add(v);
	};
	add(sp.name);
	add(sp.latin);
	for (const a of sp.aka ?? []) add(a);
	// the bare common noun: "oak" gives away "English oak" just as surely
	for (const word of sp.name.split(/[\s-]+/)) add(word);
	for (const a of sp.aka ?? []) for (const word of a.split(/[\s-]+/)) add(word);
	// the genus on its own — "Quercus" is as much of a giveaway as the binomial
	add(sp.latin.split(' ')[0]);
	// longest first, so "English oak" is replaced before the bare "oak" inside it
	return [...terms].sort((a, b) => b.length - a.length);
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function namesSpecies(text: string, sp: Species): boolean {
	return tellingTerms(sp).some((t) => new RegExp(`\\b${escape(t)}\\b`, 'i').test(text));
}

/** Replace every telling term with a neutral stand-in. */
export function redact(text: string, sp: Species): string {
	let out = text;
	for (const t of tellingTerms(sp)) {
		out = out.replace(new RegExp(`\\b${escape(t)}\\b`, 'gi'), 'this tree');
	}
	return (
		out
			// "this tree this tree" from an adjacent pair, and "a this tree"
			.replace(/\b(this tree)(\s+this tree)+/gi, 'this tree')
			.replace(/\ba this tree\b/gi, 'this tree')
			.replace(/\s{2,}/g, ' ')
			.trim()
			// a replacement that lands where the sentence started leaves a lowercase
			// "this tree wassailing survives in Somerset", which reads as a typo
			.replace(/(^|[.!?]\s+|["“(]\s*)this tree/g, (_m, pre) => `${pre}This tree`)
	);
}

function sentences(text: string): string[] {
	return text
		.replace(/\s+/g, ' ')
		.split(/(?<=[.!?])\s+(?=[A-Z"“])/)
		.map((s) => s.trim())
		.filter(Boolean);
}

/**
 * A passage usable as a prompt: prefers consecutive sentences that never name
 * the tree, because those read as written. Falls back to redacting, which is
 * always safe but occasionally clumsy.
 */
export function passageFrom(body: string, sp: Species, maxChars = 340): string {
	const parts = sentences(body);
	let best: string[] = [];
	let run: string[] = [];
	for (const s of parts) {
		if (namesSpecies(s, sp)) {
			run = [];
			continue;
		}
		run = [...run, s];
		const joined = run.join(' ');
		if (joined.length <= maxChars && joined.length > best.join(' ').length) best = run;
	}
	if (best.join(' ').length >= 90) return best.join(' ');
	return redact(parts.slice(0, 2).join(' '), sp).slice(0, maxChars);
}

/* ------------------------------------------------------------------ questions */

export type QuestionKind =
	| 'photo-tree'
	| 'photo-leaf'
	| 'photo-bark'
	| 'hint'
	| 'bark-note'
	| 'folklore'
	| 'science'
	| 'season'
	| 'tell';

export type QuizMode = 'name' | 'folklore' | 'science' | 'mixed';
export type QuizScope = 'grove' | 'guide';

const KINDS_FOR: Record<QuizMode, QuestionKind[]> = {
	name: ['photo-tree', 'photo-leaf', 'photo-bark', 'hint', 'bark-note'],
	folklore: ['folklore', 'tell'],
	science: ['science', 'season'],
	mixed: ['photo-tree', 'photo-leaf', 'photo-bark', 'hint', 'folklore', 'science', 'season', 'tell']
};

export interface Question {
	kind: QuestionKind;
	/** the instruction, e.g. "Which tree is this?" */
	ask: string;
	/** the passage, where the question is words rather than a picture */
	passage?: string;
	image?: { id: string; kind: 'tree' | 'leaf' | 'bark' };
	/** species ids, already shuffled; exactly one is `answer` */
	options: string[];
	answer: string;
	/** the line that teaches, shown once answered — right or wrong */
	because: string;
	/** anchor on the species page where the answer is explained in full */
	where: string;
}

function build(kind: QuestionKind, sp: Species, rand: () => number, now: Date): Question | null {
	const base = { kind, options: [], answer: sp.id } as unknown as Question;
	switch (kind) {
		case 'photo-tree':
			return { ...base, ask: 'Which tree is this?', image: { id: sp.id, kind: 'tree' }, because: sp.hint, where: '#spotting' };
		case 'photo-leaf':
			return { ...base, ask: 'Whose leaves are these?', image: { id: sp.id, kind: 'leaf' }, because: sp.hint, where: '#spotting' };
		case 'photo-bark':
			if (!hasBarkPhoto(sp.id)) return null;
			return { ...base, ask: 'Whose bark is this?', image: { id: sp.id, kind: 'bark' }, because: sp.bark.note, where: '#bark' };
		// Where the passage IS the fact, `because` has to add something or the
		// teaching line is just the question again with the answer written above it.
		case 'hint':
			return { ...base, ask: 'Which tree is described?', passage: redact(sp.hint, sp), because: sp.spot[0] ?? sp.hint, where: '#spotting' };
		case 'bark-note':
			return { ...base, ask: 'Whose bark is this?', passage: redact(sp.bark.note, sp), because: sp.hint, where: '#bark' };
		case 'folklore': {
			const [title, body] = sp.folklore[Math.floor(rand() * sp.folklore.length)] ?? [];
			if (!body) return null;
			return { ...base, ask: 'Which tree is this story about?', passage: passageFrom(body, sp), because: `“${title}” — ${sp.hint}`, where: '#folklore' };
		}
		case 'science': {
			const [title, body] = sp.science[Math.floor(rand() * sp.science.length)] ?? [];
			if (!body) return null;
			return { ...base, ask: 'Which tree does this describe?', passage: passageFrom(body, sp), because: `“${title}” — ${sp.hint}`, where: '#science' };
		}
		case 'season': {
			// seasonOfMonth, not the twelve-month labels in facts.ts: those read
			// "Deep winter" and would never match the four-season calendar every
			// species carries, quietly making every question a spring one.
			const season = seasonOfMonth(now.getMonth());
			const row = sp.season.find(([s]) => s.toLowerCase() === season) ?? sp.season[0];
			if (!row) return null;
			return { ...base, ask: `Which tree is doing this in ${row[0].toLowerCase()}?`, passage: redact(row[1], sp), because: sp.hint, where: '#year' };
		}
		case 'tell':
			return { ...base, ask: 'Which tree is this true of?', passage: redact(sp.tell, sp), because: sp.hint, where: '#folklore' };
	}
}

/**
 * Three wrong answers that are plausible but defensibly wrong: never a
 * confusable of the answer, and never a species the prompt happens to name
 * (oak's folklore mentions Turkey oak; offering it would be a trap).
 */
function distractorsFor(q: Question, sp: Species, pool: Species[], rand: () => number): string[] {
	const text = `${q.passage ?? ''} ${q.because}`;
	const eligible = pool.filter(
		(c) =>
			c.id !== sp.id &&
			!areConfusable(c.id, sp.id) &&
			!new RegExp(`\\b${escape(c.name)}\\b`, 'i').test(text)
	);
	// prefer the same leaf kind, so the choice is a real one rather than a
	// conifer sitting obviously among broadleaves
	const near = shuffle(eligible.filter((c) => c.key === sp.key), rand);
	const far = shuffle(eligible.filter((c) => c.key !== sp.key), rand);
	return [...near, ...far].slice(0, 3).map((c) => c.id);
}

export interface RoundOptions {
	mode: QuizMode;
	scope: QuizScope;
	/** species ids the player has found; only consulted when scope is 'grove' */
	found?: string[];
	seed: number;
	length?: number;
	/** passed in rather than read from the clock, so a round is reproducible */
	now?: Date;
}

export interface Round {
	questions: Question[];
	/** true when 'grove' was asked for but there was not enough in it */
	widened: boolean;
}

/** Four options means four species, and a confusable group can rule several out
 *  at once, so the pool has to be comfortably larger than four. */
const MIN_POOL = 8;

export function buildRound(opts: RoundOptions): Round {
	const rand = rng(opts.seed);
	const now = opts.now ?? new Date();
	const found = new Set(opts.found ?? []);
	const wanted = opts.scope === 'grove' ? SPECIES.filter((s) => found.has(s.id)) : SPECIES;
	const widened = opts.scope === 'grove' && wanted.length < MIN_POOL;
	const pool = widened ? SPECIES : wanted;

	const kinds = KINDS_FOR[opts.mode];
	const length = opts.length ?? 8;
	const subjects = shuffle(pool, rand);
	const questions: Question[] = [];

	for (let i = 0; questions.length < length && i < subjects.length * 2; i++) {
		const sp = subjects[i % subjects.length];
		if (questions.some((q) => q.answer === sp.id)) continue;
		const kind = kinds[Math.floor(rand() * kinds.length)];
		const q = build(kind, sp, rand, now);
		if (!q) continue;
		const wrong = distractorsFor(q, sp, pool, rand);
		if (wrong.length < 3) continue;
		questions.push({ ...q, options: shuffle([sp.id, ...wrong], rand) });
	}

	return { questions, widened };
}

export const nameOf = (id: string): string => speciesById(id)?.name ?? id;
