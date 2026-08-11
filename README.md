# Tree Hunt 🌿

**Learn the trees you already walk past.**

A free, offline-capable progressive web app: a field guide to 50 trees of Britain and Ireland, three ways
of working out which one you are standing under, and a quiz that tests whether it stuck.
Made in support of the [International Tree Foundation](https://internationaltreefoundation.org) —
registered charity no. 1106269.

**Live:** https://meet-a-tree.vercel.app — the hostname still carries the old name. Renaming the
Vercel project would change it, and would break the forwarding tombstone and every shared link, so
it is a separate decision from renaming the app.

Not public yet. The app was called **Meet a Tree** until August 2026; the GitHub Pages address it
first shipped from, `ruwhitehead.github.io/meet-a-tree`, is retired and forwards here
(see [issue #9](https://github.com/ruwhitehead/tree-hunt/issues/9)). Renaming the repository moves
the tombstone that does that forwarding to `/tree-hunt`, so the original address now 404s rather
than redirecting — acceptable only because nothing public ever pointed at it.

## What it is for

The app teaches recognition. It does not identify trees for you and it does not keep a logbook — it shows
you what you have not learned yet, tells you how to tell it apart, and asks you about it later.
[REDESIGN.md](REDESIGN.md) is the reasoning behind that shape, and what was removed to get there.

## The five surfaces

| Surface | What it is |
|---|---|
| **Today** | One tree fact, one tree to meet, and the seasonal hunt that is running right now. Deliberately five blocks, not ten. |
| **Grove** | The whole guide as a deck. Trees you have found show their photograph and lead; the ones still to find show a silhouette of the tree's profile with its name, so you know what you are looking for. |
| **Identify** | Five offline keys — leaf, bark, fruit, flower, and where you are standing — reordered every month so the one that can name the most trees today comes first. If they all fail, instructions for the recogniser already on your phone. |
| **Quiz** | Eight questions generated from the guide — name a tree from its photograph or bark, or answer on its folklore and science. No timer, no streak, no score kept. |
| **Learn** | Search all 50 trees by common, Latin or folk name. Species a running hunt is looking for are marked "findable now". |

Seasons is not on the tab bar: its live hunt appears on Today, and the full board of six is at
[`/missions/`](https://meet-a-tree.vercel.app/missions/).

A species page leads with **folklore**, because most people arrive browsing rather than identifying;
everything that exists to identify something links straight to "Spotting it" or "Bark" instead.

### The keys, and the season

The leaf key is useless from November to April, a flower key is dead weight from July to February, and
bark is there every day of the year. So each species records the months its fruit and flowers can actually
be found, and Identify sorts its keys by how much of the guide each can reach today, weighted by how
decisive each is. Bark leads in midwinter, leaves from April to October, fruit rises through the autumn,
and the flower key simply disappears for the half of the year it would waste your time.

Bark is the half of identification that works between November and April, when the leaf key cannot help.
Every species carries a bark note and one of six textures — smooth, peeling, banded, ridged, flaking,
fibrous — and Identify has a one-question key over them. 49 of the 50 carry a photograph. Lombardy poplar
does not: its Commons category holds 89 files and not one is of the trunk, and reusing the black poplar
picture is refused because they are the same species and two cards showing one photograph reads as a bug.
Its note still shows, and the page says why.

## Stack

- **SvelteKit** (Svelte 5 runes) + `adapter-vercel`, runtime pinned to `nodejs22.x`
- **TypeScript**, no runtime dependencies
- Hand-rolled service worker via `$service-worker` — network-first for pages, cache-first for immutable assets
- **Every page prerendered. No server routes at all**, so the app could move to `adapter-static` whenever it suits
- **Local-first**: a list of species ids and dates in `localStorage`. No accounts, no uploads, no location ever asked for

See [ARCHITECTURE.md](ARCHITECTURE.md) for how it fits together, and [DESIGN.md](DESIGN.md) for why it
looks and behaves as it does — including the decisions to remove things.

## Develop

```bash
npm install
npm run dev      # dev server — it has served stale bundles more than once; trust production
npm test         # unit tests: field key, bark, content depth, missions, quiz, install, platform
npm run check    # svelte-check
npm run build    # works on Windows again now nothing needs a serverless function
npm run icons    # regenerate PWA icons from the SVG mark
```

Content and asset tooling, run directly with `node`:

| Script | Purpose |
|---|---|
| `scripts/species-list.mjs` | The fifty species and their Commons search terms, shared by both fetchers |
| `scripts/fetch-species-images.mjs` | Fetch, crop and credit the habit and leaf photo for every species |
| `scripts/fetch-bark-images.mjs` | The same for bark. Square centre crops, because magnification has to match |
| `scripts/curate.mjs` | Pull four habit and four leaf candidates per species and build contact sheets to choose from |
| `scripts/candidates.mjs` | Earlier variant of the same idea, kept for reference |
| `scripts/og-card.mjs` | Regenerate the 1200×630 link-preview card |
| `scripts/icons.mjs` | PWA icons from the inline SVG mark |

Both fetchers are idempotent and skip anything already present; pass `--force` and an id to redo one.
Every bark result is a first pass — review it and pin a replacement in `BARK_PINS` if it is wrong.

## Honest caveats

- **ITF sign-off is outstanding.** Their name, logo and charity number are used on the strength of a family
  connection, not written permission — see [issue #8](https://github.com/ruwhitehead/tree-hunt/issues/8).
- **Lombardy poplar has no bark and no flower photograph**, and never fruits in Britain (it is a male
  clone). Listed in `BARK_PHOTO_MISSING` and `FLOWER_PHOTO_MISSING`; leylandii and ornamental cherry are in
  `FRUIT_PHOTO_MISSING` because they genuinely barely fruit. Tests keep all three honest both ways.
- **Old followed-tree data is cleared on load.** Following was retired; `src/lib/legacy-cleanup.ts` removes
  the records and the photo database it left behind. An export was built first and then dropped, because
  the app is unreleased and the feature was never used by anyone.
- **The canonical URL is a constant.** `src/lib/site.ts` holds it, for absolute Open Graph URLs. Update it if
  the app moves to a custom domain.
- **`PLANTNET_API_KEY` should be deleted from the Vercel project.** Photo identification is gone and
  nothing reads it.
- Content lives in `src/lib/content/` as typed data, so new species are reviewable pull requests.
- "Grove" is the in-app noun for species you have met, and now the name of the tab. The brand is Tree Hunt.
