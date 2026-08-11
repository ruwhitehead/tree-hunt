// Fetches one fruit and one flower close-up per species from Wikimedia Commons.
// Run: node scripts/fetch-organ-images.mjs [fruit|flower] [--force] [id ...]
//
// Same shape as fetch-bark-images.mjs, and the same hard lesson: searching file
// TITLES alone misses most of what is there, because a correctly identified
// photograph often has a useless filename. So this searches titles first and
// then falls back to walking the species' Commons CATEGORY and reading
// descriptions, which is what found five of the six "impossible" barks.
//
// Unlike bark, these are cropped 4:3 like the habit and leaf shots. Bark is a
// texture sample where magnification has to match across the set; a fruit or a
// flower is an object, and the eye scales it against the twig it is on.
import sharp from 'sharp';
import { SPECIES_SOURCES } from './species-list.mjs';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';

const UA = 'TreeHunt/0.1 (https://github.com/ruwhitehead/tree-hunt; tree companion PWA)';
const api = 'https://commons.wikimedia.org/w/api.php';

const ORGAN = {
	fruit: {
		terms: (q) => [`${q} fruit`, `${q} fruits`, `${q} cones`, `${q} nuts`, `${q} berries`, `${q} seeds`, `${q} acorns`, `${q} cone`],
		want: /fruit|berr|nut|acorn|cone|seed|samara|catkin|kernel|drupe|pod|capsule|conker|haw|sloe|key/i,
		reject: /bark|trunk|bole|leaf|leaves|foliage|habit|bud|wood|timber|plank|furniture|dish|jam|jelly|recipe/i
	},
	flower: {
		terms: (q) => [`${q} flowers`, `${q} flower`, `${q} blossom`, `${q} catkins`, `${q} inflorescence`, `${q} bloom`],
		want: /flower|blossom|catkin|inflorescen|bloom|ament|floral/i,
		reject: /bark|trunk|bole|fruit|berr|nut|acorn|seed|habit|honey|jam|cordial|recipe|wine/i
	}
};

const BAD =
	/herbarium|map|distribution|range|illustration|drawing|plate |cyclopedia|engraving|botanical art|damage|miner|disease|dieback|canker|pest|gall|logo|sign|stamp|coin|cross-section|bonsai|seedling/i;

/** Curated by eye, keyed by organ then species id. Everything here was found by
 *  the category-and-description pass rather than by filename, which is the rule
 *  rather than the exception on Commons. */
const PINS = {
	fruit: {
		// "Reife Samenkapseln" - ripe capsules. Two other candidates were captioned
		// "however not 100% sure", which is not a caption you build a guide on
		box: 'File:Samen des Buchsbaum IMG 9569.jpg',
		'common-lime': 'File:Tilia x europea seeds, Hollandse linde zaden.jpg',
		'weeping-willow': 'File:Salix x 20050523 894.jpg'
	},
	flower: {
		'sessile-oak': 'File:Quercus petraea 04.jpg',
		'downy-birch': 'File:Betula pubescens RF.jpg',
		'field-maple': 'File:Acer-campestre-flowers.JPG',
		'london-plane': 'File:Platanus hispanica inflorescences.JPG',
		// determined against a published flora, and far larger than the geograph
		// alternative, which was only 640px wide
		'black-poplar': 'File:Populus nigra sl19.jpg',
		'common-lime': 'File:Tilia x europea flowers, Hollandse linde bloemen (1).jpg',
		'weeping-willow': 'File:Malpighiales - Salix babylonica - 9.jpg'
	}
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(params) {
	const res = await fetch(`${api}?${new URLSearchParams({ format: 'json', ...params })}`, {
		headers: { 'User-Agent': UA }
	});
	return res.ok ? res.json() : null;
}

function hit(p, ii) {
	return {
		thumb: ii.thumburl ?? ii.url,
		page: ii.descriptionurl,
		artist: (ii.extmetadata?.Artist?.value ?? 'Unknown').replace(/<[^>]+>/g, '').trim().slice(0, 60),
		license: ii.extmetadata?.LicenseShortName?.value ?? 'see source',
		file: p.title,
		desc: (ii.extmetadata?.ImageDescription?.value ?? '').replace(/<[^>]+>/g, ' ')
	};
}

const free = (l) => /^cc|public domain|cc0/i.test(l);

async function byTitle(title) {
	const d = await get({
		action: 'query',
		titles: title,
		prop: 'imageinfo',
		iiprop: 'url|mime|extmetadata',
		iiurlwidth: '1000'
	});
	const p = Object.values(d?.query?.pages ?? {})[0];
	const ii = p?.imageinfo?.[0];
	return ii && /image\/(jpeg|png)/.test(ii.mime) ? hit(p, ii) : null;
}

/** Pass one: the filename says what it is and which species it is. */
async function searchByTitle(q, spec) {
	const genus = q.split(' ')[0].toLowerCase();
	const epithet = q.split(' ')[1]?.toLowerCase() ?? '';
	for (const term of spec.terms(q)) {
		const d = await get({
			action: 'query',
			generator: 'search',
			gsrsearch: term,
			gsrnamespace: '6',
			gsrlimit: '20',
			prop: 'imageinfo',
			iiprop: 'url|mime|extmetadata',
			iiurlwidth: '1000'
		});
		for (const p of Object.values(d?.query?.pages ?? {}).sort((a, b) => a.index - b.index)) {
			const ii = p.imageinfo?.[0];
			if (!ii || !/image\/(jpeg|png)/.test(ii.mime)) continue;
			const t = p.title.toLowerCase();
			if (BAD.test(t) || spec.reject.test(t) || !spec.want.test(t)) continue;
			if (!(t.includes(genus) && t.includes(epithet))) continue;
			if (!free(ii.extmetadata?.LicenseShortName?.value ?? '')) continue;
			return hit(p, ii);
		}
		await sleep(110);
	}
	return null;
}

/** Pass two: the category vouches for the species, the description for the organ. */
async function searchByCategory(q, spec) {
	const d = await get({
		action: 'query',
		list: 'categorymembers',
		cmtitle: `Category:${q}`,
		cmlimit: '500',
		cmtype: 'file'
	});
	const titles = (d?.query?.categorymembers ?? []).map((m) => m.title);
	for (let i = 0; i < titles.length; i += 20) {
		const dd = await get({
			action: 'query',
			titles: titles.slice(i, i + 20).join('|'),
			prop: 'imageinfo',
			iiprop: 'url|mime|extmetadata',
			iiurlwidth: '1000'
		});
		for (const p of Object.values(dd?.query?.pages ?? {})) {
			const ii = p.imageinfo?.[0];
			if (!ii || !/image\/(jpeg|png)/.test(ii.mime)) continue;
			const hay = `${p.title} ${(ii.extmetadata?.ImageDescription?.value ?? '').replace(/<[^>]+>/g, ' ')}`;
			if (BAD.test(p.title) || spec.reject.test(hay) || !spec.want.test(hay)) continue;
			if (!free(ii.extmetadata?.LicenseShortName?.value ?? '')) continue;
			return hit(p, ii);
		}
		await sleep(110);
	}
	return null;
}

const args = process.argv.slice(2);
const organs = args.filter((a) => a in ORGAN);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--') && !(a in ORGAN));
if (!organs.length) {
	console.error('usage: node scripts/fetch-organ-images.mjs fruit|flower [--force] [id ...]');
	process.exit(1);
}

mkdirSync('static/images/species', { recursive: true });
const credits = existsSync('src/lib/content/credits.json')
	? JSON.parse(readFileSync('src/lib/content/credits.json', 'utf8'))
	: {};

for (const organ of organs) {
	const spec = ORGAN[organ];
	const missing = [];
	for (const sp of SPECIES_SOURCES) {
		if (only.length && !only.includes(sp.id)) continue;
		const out = `static/images/species/${sp.id}-${organ}.webp`;
		try {
			if (!force && existsSync(out) && credits[sp.id]?.[organ]) continue;
			const q = sp.search ?? sp.latin;
			const found =
				(PINS[organ][sp.id] ? await byTitle(PINS[organ][sp.id]) : null) ??
				(await searchByTitle(q, spec)) ??
				(await searchByCategory(q, spec));
			if (!found) throw new Error('nothing found');
			const res = await fetch(found.thumb, { headers: { 'User-Agent': UA } });
			const buf = Buffer.from(await res.arrayBuffer());
			await sharp(buf).resize(900, 675, { fit: 'cover', position: 'attention' }).webp({ quality: 68 }).toFile(out);
			await sharp(buf)
				.resize(480, 360, { fit: 'cover', position: 'attention' })
				.webp({ quality: 66 })
				.toFile(out.replace('.webp', '-480.webp'));
			credits[sp.id] = {
				...(credits[sp.id] ?? {}),
				[organ]: { artist: found.artist, license: found.license, page: found.page, file: found.file }
			};
			console.log(`ok   ${organ} ${sp.id}: ${found.file}`);
		} catch (e) {
			missing.push(sp.id);
			console.error(`FAIL ${organ} ${sp.id}: ${e.message}`);
		}
		await sleep(140);
	}
	writeFileSync('src/lib/content/credits.json', JSON.stringify(credits, null, '\t'));
	console.log(`\n${organ}: ${missing.length} without an image: ${missing.join(', ') || 'none'}`);
}
console.log('credits written. Every result is a first pass - review and pin replacements in PINS.');
