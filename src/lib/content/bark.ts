import type { BarkTexture, Species } from './types';
import { SPECIES } from './species';

/**
 * The bark key: one question, six answers.
 *
 * The leaf key asks three questions because leaves genuinely divide three
 * times. Bark does not. Pushed past one question it starts asking things
 * nobody standing in a wood in February can answer - is that fissure deep or
 * shallow, is that plate square or oblong - so it asks once, honestly, and
 * then shows you the photographs and lets your eye do the rest. Comparing a
 * trunk against twenty pictures is a task people are good at; answering
 * "would you call that furrowed?" is not.
 *
 * Ordered by how quickly someone can rule the answer in or out, not
 * alphabetically: the two unmistakable ones first, the big general bucket last.
 */
export const BARK_KEY: { id: BarkTexture; title: string; desc: string }[] = [
	{
		id: 'peeling',
		title: 'Peeling in papery strips',
		desc: 'Comes away in horizontal ribbons you can lift with a thumbnail'
	},
	{
		id: 'banded',
		title: 'Shiny, with horizontal bands',
		desc: 'A polished look, ringed with raised horizontal lines of breathing pores'
	},
	{
		id: 'smooth',
		title: 'Smooth',
		desc: 'Barely a ridge on it. A palm run down the trunk catches on nothing'
	},
	{
		id: 'fibrous',
		title: 'Stringy and fibrous',
		desc: 'Soft, shredding into vertical strings you can pull away'
	},
	{
		id: 'flaking',
		title: 'Flaking in plates or patches',
		desc: 'Breaking off in scales, squares or camouflage patches, often a different colour beneath'
	},
	{
		id: 'ridged',
		title: 'Ridged and furrowed',
		desc: 'Hard vertical ridges with clefts between them. The commonest bark on a mature broadleaf'
	}
];

export const barkCandidates = (texture: BarkTexture): Species[] =>
	SPECIES.filter((s) => s.bark.texture === texture);

export const barkLabel = (texture: BarkTexture): string =>
	BARK_KEY.find((k) => k.id === texture)?.title ?? texture;

/**
 * Species whose bark photograph is deliberately absent. The note still shows;
 * the photograph waits for a real one. Kept here rather than probed at runtime
 * so a missing file is a decision on the record and not a silent 404.
 *
 * Down to one. Lombardy poplar's Commons category holds 89 files and not one is
 * of the trunk. Reusing the black poplar photograph is refused: they are the
 * same species — Lombardy is the cultivar 'Italica' — so the picture would be
 * botanically defensible and wrong here, where two cards showing one photograph
 * reads as a bug, and where the quiz would build a question nobody could answer.
 * What separates them is the shape of the whole tree, not the bark, and the note
 * says so.
 */
export const BARK_PHOTO_MISSING = new Set(['lombardy-poplar']);

export const hasBarkPhoto = (id: string): boolean => !BARK_PHOTO_MISSING.has(id);
