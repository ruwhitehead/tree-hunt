// Fetches one bark close-up per species from Wikimedia Commons, resizes to webp
// and appends the licence credit alongside the habit and leaf ones.
// Run: node scripts/fetch-bark-images.mjs [--force] [id ...]
//
// A NOTE ON SCALE, which is the whole difficulty with bark photography:
// a tight crop of beech and a wide shot of beech look like different species,
// so a set of bark photographs at uncontrolled magnification does not merely
// look untidy, it actively lies to the reader comparing them. Nothing here can
// fix that automatically - the source images are shot at whatever distance the
// photographer chose. So this script:
//   - crops square and from the centre, never 'attention', which on bark picks
//     an arbitrary knot and throws the magnification away
//   - refuses images whose title suggests leaves, flowers, fruit or seedlings
//   - is a FIRST PASS. Every result wants a human eye, and anything at the
//     wrong magnification or on a young trunk should be replaced by pinning an
//     exact File: title in BARK_PINS below.
// Bark also changes radically with age. The guide shows mature bark and says so
// in the copy; where the young form would mislead, the species' `bark.young`
// note covers it in words.
import sharp from 'sharp';
import { SPECIES_SOURCES } from './species-list.mjs';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';

const UA = 'TreeHunt/0.1 (https://github.com/ruwhitehead/tree-hunt; tree companion PWA)';

/** Curated by eye. Anything listed here wins over the search.
 *
 *  Five of these were found only on a second, much wider pass. The first search
 *  matched file TITLES for "<binomial> bark", which misses the very common case
 *  of a correctly identified photograph with a useless filename. Walking the
 *  Commons taxon categories and reading DESCRIPTIONS instead found all but one,
 *  including under names the first pass never tried - whitebeam has been moved
 *  out of Sorbus to Aria, and the Leyland hybrid is filed under three genera.
 *
 *  ONE species is still deliberately without a bark photograph: Lombardy
 *  poplar. Its category holds 89 files and not one is of the trunk, and no
 *  search finds one. Reusing the black poplar image is refused - they are the
 *  same species, so the picture would be defensible botanically and wrong in
 *  the app, where two cards showing one photograph reads as a bug and would
 *  make an unanswerable quiz question. Its bark note still appears. */
const BARK_PINS = {
	// "Sorbus aria; a trunk" - the same (ms) photographer series this project
	// already pins for several leaf shots, so it matches them in framing
	whitebeam: 'File:(ms) Sorbus aria 10.jpg',
	// "Hawthorn bark in Gunnersbury Triangle", a London nature reserve
	hawthorn: 'File:GT Hawthorn.jpg',
	// "Trunk. Taxonym: Malus sylvestris ss Fischer et al." - determined against a
	// published flora, which rules out the domestica escapes that plague the name
	'crab-apple': 'File:Malus sylvestris sl8.jpg',
	// "The trunk of an old Common Lime Tilia × europaea in a park in London"
	'common-lime': 'File:Malvales - Tilia x europaea - 1.jpg',
	// "cultivar 'Haggerston Grey', trunk, 1.1m diameter ... Kyloe Wood,
	// Northumberland" - and a stated diameter is a scale reference, which is the
	// one thing bark photographs almost never carry
	leylandii: 'File:Cupressus leylandii1.jpg',
	// The search's own pick for oak was the one GFDL-1.2-only image in the whole
	// app, and GFDL wants the full licence text shipped alongside, which is not a
	// thing a caption can honestly do. This one is CC BY 4.0, the right species,
	// and photographed in winter - which is the season the bark key is for.
	oak: 'File:Bark of European oak (Quercus robur) in winter, Woodland south of Schlosspark Belvedere, Weimar, Germany 01.jpg',
	juniper: 'File:Juniperus communis stem Loigu keerdkadakas.jpg',
	'field-maple': 'File:Acer campestre bark 1.jpg',
	'weeping-willow': 'File:Salix babylonica bark close-up 1.jpg',
	'ornamental-cherry': 'File:Detail of the bark of Prunus serrulata - geograph.org.uk - 6601982.jpg'
};

const BAD =
	/herbarium|map|distribution|range|illustration|drawing|plate|cyclopedia|engraving|botanical art|damage|miner|disease|dieback|canker|pest|logo|sign|stamp|coin|cross-section|log |timber|furniture|bonsai|seedling|sapling|leaf|leaves|foliage|flower|blossom|catkin|fruit|acorn|cone|nut|berry|seed|needle/;

/** Bark searches, in order of how likely they are to be a plain trunk shot. */
const terms = (q) => [`${q} bark`, `${q} trunk`, `${q} bole`, `${q} stem bark`];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function commonsFile(title) {
	const url =
		'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
		`&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=1000`;
	const res = await fetch(url, { headers: { 'User-Agent': UA } });
	const data = await res.json();
	const p = Object.values(data?.query?.pages ?? {})[0];
	const ii = p?.imageinfo?.[0];
	if (!ii || !/image\/(jpeg|png)/.test(ii.mime)) return null;
	return hit(p, ii);
}

function hit(p, ii) {
	return {
		thumb: ii.thumburl ?? ii.url,
		page: ii.descriptionurl,
		artist: (ii.extmetadata?.Artist?.value ?? 'Unknown').replace(/<[^>]+>/g, '').trim().slice(0, 60),
		license: ii.extmetadata?.LicenseShortName?.value ?? 'see source',
		file: p.title
	};
}

/** Requires the binomial in the file title, so we never ship a stock "tree bark"
 *  texture, and requires the word bark or trunk, so we never ship a habit shot. */
async function search(q, latin) {
	const genus = latin.split(' ')[0].toLowerCase();
	const epithet = latin.split(' ')[1]?.toLowerCase() ?? '';
	for (const term of terms(q)) {
		const url =
			'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search' +
			`&gsrsearch=${encodeURIComponent(term)}&gsrnamespace=6&gsrlimit=20` +
			'&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=1000';
		const res = await fetch(url, { headers: { 'User-Agent': UA } });
		const data = await res.json();
		const pages = Object.values(data?.query?.pages ?? {}).sort((a, b) => a.index - b.index);
		for (const p of pages) {
			const ii = p.imageinfo?.[0];
			if (!ii || !/image\/(jpeg|png)/.test(ii.mime)) continue;
			const title = (p.title || '').toLowerCase();
			if (BAD.test(title)) continue;
			if (!/bark|trunk|bole|cortex/.test(title)) continue;
			if (!(title.includes(genus) && title.includes(epithet))) continue;
			return hit(p, ii);
		}
		await sleep(120);
	}
	return null;
}

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));

mkdirSync('static/images/species', { recursive: true });
const credits = existsSync('src/lib/content/credits.json')
	? JSON.parse(readFileSync('src/lib/content/credits.json', 'utf8'))
	: {};

const missing = [];
for (const sp of SPECIES_SOURCES) {
	if (only.length && !only.includes(sp.id)) continue;
	const out = `static/images/species/${sp.id}-bark.webp`;
	try {
		if (!force && existsSync(out) && credits[sp.id]?.bark) continue;
		const q = sp.search ?? sp.latin;
		const found = BARK_PINS[sp.id] ? await commonsFile(BARK_PINS[sp.id]) : await search(q, q);
		if (!found) throw new Error('no bark image found');
		const res = await fetch(found.thumb, { headers: { 'User-Agent': UA } });
		const buf = Buffer.from(await res.arrayBuffer());
		// square, centre-cropped: bark is a texture, and a centre crop is the only
		// one that keeps the magnification the photographer chose
		await sharp(buf).resize(800, 800, { fit: 'cover', position: 'centre' }).webp({ quality: 70 }).toFile(out);
		await sharp(buf)
			.resize(400, 400, { fit: 'cover', position: 'centre' })
			.webp({ quality: 68 })
			.toFile(out.replace('.webp', '-480.webp'));
		credits[sp.id] = {
			...(credits[sp.id] ?? {}),
			bark: { artist: found.artist, license: found.license, page: found.page, file: found.file }
		};
		console.log(`ok   ${sp.id}: ${found.file}`);
	} catch (e) {
		missing.push(sp.id);
		console.error(`FAIL ${sp.id}: ${e.message}`);
	}
	await sleep(150);
}

writeFileSync('src/lib/content/credits.json', JSON.stringify(credits, null, '\t'));
console.log(`\ncredits written. ${missing.length} still without bark: ${missing.join(', ') || 'none'}`);
console.log('Every result is a first pass - review each one and pin replacements in BARK_PINS.');
