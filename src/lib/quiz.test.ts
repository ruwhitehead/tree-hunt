import { describe, expect, it } from 'vitest';
import {
	areConfusable,
	buildRound,
	CONFUSABLE,
	namesSpecies,
	passageFrom,
	redact,
	rng,
	seedFrom,
	tellingTerms,
	type QuizMode
} from './quiz';
import { SPECIES, speciesById } from './content/species';
import { BARK_PHOTO_MISSING } from './content/bark';

const MODES: QuizMode[] = ['name', 'folklore', 'science', 'mixed'];
const oak = speciesById('oak')!;

/** Every question the generator can produce, across modes and many seeds. */
function everyQuestion(count = 60) {
	const out = [];
	for (const mode of MODES) {
		for (let s = 0; s < count; s++) {
			out.push(
				...buildRound({ mode, scope: 'guide', seed: s, now: new Date(2026, 7, 9) }).questions.map(
					(q) => ({ q, mode, seed: s })
				)
			);
		}
	}
	return out;
}

describe('redaction — a prompt must never contain its own answer', () => {
	it('strips the name, the Latin name, the aliases and the bare common noun', () => {
		const text = 'The oak was sacred, and Quercus robur is the pedunculate oak of England.';
		const out = redact(text, oak);
		expect(out).not.toMatch(/\boak\b/i);
		expect(out).not.toMatch(/\bquercus\b/i);
		expect(out).not.toMatch(/\bpedunculate\b/i);
	});

	it('leaves words that only look like the answer', () => {
		// \b means Sevenoaks survives, which is right: it does not give the game away
		expect(redact('Sevenoaks is in Kent.', oak)).toBe('Sevenoaks is in Kent.');
	});

	it('does not strip words too generic to matter', () => {
		expect(tellingTerms(oak)).not.toContain('English');
		expect(tellingTerms(speciesById('common-lime')!)).not.toContain('Common');
	});

	it('collapses the stutter that adjacent replacements make', () => {
		expect(redact('The English oak, or common oak, is native.', oak)).not.toMatch(
			/this tree this tree/i
		);
	});

	it('recapitalises where a replacement lands at the start of a sentence', () => {
		// "oak wassailing survives in Somerset" must not become "this tree
		// wassailing survives", which reads as a typo
		expect(redact('Oak wassailing survives in Somerset.', oak)).toBe(
			'This tree wassailing survives in Somerset.'
		);
		expect(redact('It is old. Oak was sacred.', oak)).toBe('It is old. This tree was sacred.');
	});

	it('never opens a generated prompt in lower case', () => {
		for (const { q, mode, seed } of everyQuestion(25)) {
			if (!q.passage) continue;
			expect(q.passage[0], `${mode}/${seed} ${q.kind}: ${q.passage.slice(0, 40)}`).toBe(
				q.passage[0].toUpperCase()
			);
		}
	});

	it('teaches something the question did not already say', () => {
		for (const { q, mode, seed } of everyQuestion(25)) {
			if (!q.passage) continue;
			expect(q.because, `${mode}/${seed} ${q.kind} repeats its own prompt`).not.toBe(q.passage);
		}
	});

	it('holds for every species in the guide', () => {
		for (const sp of SPECIES) {
			const all = [sp.hint, sp.tell, sp.bark.note, ...sp.folklore.map((f) => f[1])].join(' ');
			expect(namesSpecies(redact(all, sp), sp), sp.id).toBe(false);
		}
	});

	it('prefers real sentences over redacted ones where the prose allows', () => {
		// the fallback is safe but clumsy; a passage that never named the tree in
		// the first place reads as written, and most bodies contain one
		const natural = SPECIES.filter((sp) =>
			sp.folklore.some((f) => !passageFrom(f[1], sp).includes('this tree'))
		);
		expect(natural.length).toBeGreaterThan(SPECIES.length / 2);
	});

	it('never leaks the answer into any generated prompt', () => {
		for (const { q, mode, seed } of everyQuestion()) {
			const sp = speciesById(q.answer)!;
			const text = `${q.ask} ${q.passage ?? ''}`;
			expect(namesSpecies(text, sp), `${mode}/${seed} ${q.kind} ${sp.id}: ${text}`).toBe(false);
		}
	});
});

describe('distractors — no question may have two defensible answers', () => {
	it('knows which species the guide holds near-duplicates of', () => {
		expect(areConfusable('oak', 'sessile-oak')).toBe(true);
		expect(areConfusable('hawthorn', 'blackthorn')).toBe(true);
		expect(areConfusable('oak', 'beech')).toBe(false);
		expect(areConfusable('oak', 'oak')).toBe(false);
	});

	it('lists only real species in the confusable groups', () => {
		for (const group of CONFUSABLE)
			for (const id of group) expect(speciesById(id), id).toBeTruthy();
	});

	it('never offers a confusable of the answer as a wrong option', () => {
		for (const { q, mode, seed } of everyQuestion()) {
			for (const opt of q.options) {
				expect(
					areConfusable(opt, q.answer),
					`${mode}/${seed} ${q.kind}: ${opt} against ${q.answer}`
				).toBe(false);
			}
		}
	});

	it('never offers a species the prompt already names', () => {
		// oak's folklore mentions Turkey oak; offering a named tree is a trap
		for (const { q, mode, seed } of everyQuestion()) {
			const text = `${q.passage ?? ''} ${q.because}`;
			for (const opt of q.options) {
				if (opt === q.answer) continue;
				const name = speciesById(opt)!.name;
				expect(
					new RegExp(`\\b${name}\\b`, 'i').test(text),
					`${mode}/${seed} ${q.kind}: names ${name}`
				).toBe(false);
			}
		}
	});

	it('gives four distinct options, exactly one of them right', () => {
		for (const { q, mode, seed } of everyQuestion()) {
			expect(q.options, `${mode}/${seed}`).toHaveLength(4);
			expect(new Set(q.options).size, `${mode}/${seed} duplicate option`).toBe(4);
			expect(q.options.filter((o) => o === q.answer), `${mode}/${seed}`).toHaveLength(1);
		}
	});
});

describe('a round', () => {
	it('is the length asked for, and never repeats a tree', () => {
		for (const mode of MODES) {
			const { questions } = buildRound({ mode, scope: 'guide', seed: 7 });
			expect(questions, mode).toHaveLength(8);
			expect(new Set(questions.map((q) => q.answer)).size, mode).toBe(8);
		}
	});

	it('is reproducible from its seed, so it can be shared and tested', () => {
		const a = buildRound({ mode: 'mixed', scope: 'guide', seed: 42, now: new Date(2026, 7, 9) });
		const b = buildRound({ mode: 'mixed', scope: 'guide', seed: 42, now: new Date(2026, 7, 9) });
		expect(JSON.stringify(a)).toBe(JSON.stringify(b));
	});

	it('differs between seeds', () => {
		const a = buildRound({ mode: 'mixed', scope: 'guide', seed: 1 });
		const b = buildRound({ mode: 'mixed', scope: 'guide', seed: 2 });
		expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
	});

	it('asks only the kinds the chosen mode covers', () => {
		const folklore = buildRound({ mode: 'folklore', scope: 'guide', seed: 3 });
		for (const q of folklore.questions) expect(['folklore', 'tell']).toContain(q.kind);
		const name = buildRound({ mode: 'name', scope: 'guide', seed: 3 });
		for (const q of name.questions)
			expect(['photo-tree', 'photo-leaf', 'photo-bark', 'hint', 'bark-note']).toContain(q.kind);
	});

	it('only shows a bark photograph where one exists', () => {
		for (const { q } of everyQuestion()) {
			if (q.image?.kind !== 'bark') continue;
			expect([...BARK_PHOTO_MISSING]).not.toContain(q.image.id);
		}
	});

	it('quizzes only what you have found, when asked to', () => {
		const found = SPECIES.slice(0, 12).map((s) => s.id);
		const { questions, widened } = buildRound({ mode: 'mixed', scope: 'grove', seed: 5, found });
		expect(widened).toBe(false);
		for (const q of questions) {
			expect(found).toContain(q.answer);
			for (const o of q.options) expect(found).toContain(o);
		}
	});

	it('widens to the whole guide rather than serving a two-option quiz', () => {
		const { questions, widened } = buildRound({
			mode: 'mixed',
			scope: 'grove',
			seed: 5,
			found: ['oak', 'birch']
		});
		expect(widened).toBe(true);
		expect(questions).toHaveLength(8);
	});

	it('still fills a round in every month, since seasonal prompts move', () => {
		for (let m = 0; m < 12; m++) {
			const r = buildRound({ mode: 'science', scope: 'guide', seed: 11, now: new Date(2026, m, 15) });
			expect(r.questions, `month ${m}`).toHaveLength(8);
		}
	});

	it('always carries a line that teaches, and somewhere to read more', () => {
		for (const { q, mode } of everyQuestion(20)) {
			expect(q.because.length, `${mode} ${q.kind}`).toBeGreaterThan(10);
			expect(q.where, `${mode} ${q.kind}`).toMatch(/^#/);
		}
	});
});

describe('the seeded generator', () => {
	it('is deterministic and stays inside [0, 1)', () => {
		const a = rng(123);
		const b = rng(123);
		for (let i = 0; i < 500; i++) {
			const v = a();
			expect(v).toBe(b());
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});

	it('turns a date into a stable seed', () => {
		expect(seedFrom('2026-08-09')).toBe(seedFrom('2026-08-09'));
		expect(seedFrom('2026-08-09')).not.toBe(seedFrom('2026-08-10'));
	});
});
