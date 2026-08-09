# Redesign — from tool to teacher

A plan for six changes asked for after user feedback. Written to be read alongside
`DESIGN.md`, whose standing rules still apply and are cited throughout.

> **Status: delivered.** All five phases are built, on `redesign/tool-to-teacher`.
> `svelte-check` and 68 unit tests pass, and Lighthouse accessibility is 1.0 on all
> seven audited routes including the greyed deck and the new quiz. What follows is
> the plan as written; where the build departed from it, a note says so and why.
> The durable decisions have been folded into `DESIGN.md` and `ARCHITECTURE.md`,
> which are the documents to trust once this one goes stale.
>
> **Three things still want a human:**
> 1. Delete `PLANTNET_API_KEY` from the Vercel project. Nothing reads it.
> 2. Review the 44 bark photographs and pin replacements in `BARK_PINS`; find real
>    ones for the six species that have none.
> 3. Decide when to clear the legacy `mat-trees-v1` and IndexedDB stores. They are
>    deliberately untouched, and the export has to be available long enough to be fair.

---

## 1. What the six changes actually are

Taken one at a time they read as a list of edits. Taken together they are a single
repositioning, and the plan is much simpler once that is said out loud.

Today the app does five jobs: identify a tree for you, let you follow one through the
year, submit records to a national scheme, collect species, and teach. That is four
tools and a guide, and the two most expensive tools are the two being cut.

**The proposition after this work: *learn to name the trees you walk past.***

The app stops being a sensor and stops being a logbook. It becomes the thing that
teaches recognition, shows you what you have not learned yet, and tests you on it.
Every one of the six requests is the same move:

| # | Request | What it does to the proposition |
|---|---|---|
| 1 | Remove the camera | We stop identifying *for* you |
| 2 | Remove watch-this-tree | We stop logging *for* you |
| 3 | Bark guidance with photos | Teach a second sense — and the winter half of the year |
| 4 | Grey out unfound trees in the deck | Make the target visible: a curriculum, not a trophy case |
| 5 | Quiz | Test retention — the missing half of learning |
| 6 | Lens / Look Up instructions | An honest escape hatch for when teaching fails |

This also resolves an old tension in `DESIGN.md`. "Prefer removing a concept to adding
one" has been the standing rule, and the app kept adding. This plan removes two large
concepts and adds two small ones.

### What we lose, honestly

Photo identification **works in production** — the live `/api/identify` endpoint gets
past its key check, so `PLANTNET_API_KEY` is set on Vercel. This is not a dead feature
being tidied away; it is a working one being cut on purpose, and the Pl@ntNet key
should be removed from Vercel as part of the work.

Following a tree is a genuinely good idea that most people did not do. It also carries
the only user-generated data in the app. See §8 — that data needs an exit before the
code goes.

---

## 2. The navigation has to be re-solved

This is the one structural decision, and it is forced rather than chosen.

The camera is the centre of the tab bar — the raised green FAB in
`src/lib/components/Nav.svelte`. Remove the camera and there is a hole in the middle of
the primary navigation. Add a quiz and there is a sixth destination competing for five
slots.

Current: `Today · My Trees · [📷 FAB] · Seasons · Learn`

**Recommendation:** `Today · Grove · Identify · Quiz · Learn` — five flat tabs, no FAB.

- **The FAB goes entirely.** It was the camera's affordance. Nothing else in the app
  deserves a raised action, and promoting Quiz into it would overstate a thing you do
  occasionally.
- **"My Trees" becomes "Grove".** With following gone the tab holds species you have
  met, which is what a grove is. `grove` is already the established noun and
  `/grove` already exists as a redirect — reverse it, so `/grove` is the real route
  and `/trees` redirects to it. Both URLs keep working; nothing shared goes stale.
- **Seasons folds into Today.** Today and Seasons are the same axis — *what is worth
  doing now*. Today is about to lose its "your trees this week" block and would be down
  to a fact, a featured tree and the donate ask, which is thin. Absorbing the seasonal
  hunts gives it substance back. The board can keep living at `/missions` and be linked
  from Today, off the tab bar, exactly as `/citizen-science` does today.

**The alternative,** if you would rather not touch Seasons: keep it on the bar and put
Quiz inside Learn, giving `Today · Grove · Identify · Seasons · Learn`. It is a smaller
change and a quieter quiz. I would not choose it — you are investing real work in the
quiz and it should be a destination — but it is defensible.

**This needs your call before Phase 4.**

---

## 3. Item 4 — the grove deck

Smallest change, highest value, and it fixes a bug the feedback is really about.

### The actual defect

In `src/routes/trees/+page.svelte:144` an unfound species links to `/identify/`, not to
its own page, and renders as the words "Not yet met" over a generic silhouette. The
name is hidden. So the deck cannot tell you what you are looking for, and you cannot
even tap through to find out. That is precisely the complaint.

### The design

- **Unfound cards show the real photo in greyscale, with the real name and latin
  name.** Colour is the reward; identity is not.
- **Unfound cards link to the species page.** This one line change is the largest single
  improvement in this document.
- **Sort found first**, most-recently-found at the front so the last win is visible,
  then unfound alphabetically.
- **Label the two blocks**: `Found · 12` and `Still to find · 38`. A labelled target
  list is a checklist; an unlabelled grey wall is 38 failures. The existing code comment
  at `src/routes/trees/+page.svelte:26` worries about exactly this, and the worry is
  still right — the fix is the heading, not hiding the names.
- **Keep the six-starters block** while found < 3.

### The accessibility constraint — this has bitten before

Faded locked cards previously shipped and failed the Lighthouse gate at **2.33:1**.
Lighthouse accessibility 100 is a release gate, not an aspiration. Therefore:

- Grey the **image only**, with `filter: grayscale(1)` on the `<img>`.
- **Never `opacity`** on the card, and never on text. Text stays `--ink` and `--soft`
  at their normal values.
- **Never information by colour alone** — greyscale is a colour signal, so the card also
  carries a text or outline marker ("not found yet"). This also covers forced-colours
  mode, where CSS filters are dropped.
- Add the rule to `DESIGN.md` so the regression cannot return quietly.

### The moment

Removing the camera and the tree timeline removes both of the app's small delights. The
grey-to-colour transition when a species is found becomes *the* moment: a 400 ms
`grayscale(1) → grayscale(0)` with a slight scale, behind `prefers-reduced-motion`. It
is worth building properly rather than letting the card just swap.

---

## 4. Item 3 — bark

The richest of the six, and the one worth thinking about hardest.

### The insight

The field key in `src/lib/content/key.ts` is leaf-first: `needle | simple | lobed |
compound`. From November to April there are no leaves on most of the guide. **Bark is
not a nice extra — it is the missing half of the key**, and it is what makes the app
usable in winter.

So bark lands in three places, not one.

### Content model

Add to `Species` in `src/lib/content/types.ts`:

```ts
bark: {
  texture: BarkTexture;
  /** what you see and feel, at chest height, on a mature trunk */
  note: string;
  /** how the young tree differs, where it differs enough to mislead */
  young?: string;
};
```

Bark prose already exists — roughly 70 mentions scattered through the `spot` arrays of
`species-a.ts` … `species-g.ts` (e.g. oak's *"grey-brown and, on mature trees, deeply
and irregularly fissured into hard vertical plates"*). Most of the writing is done;
this is extraction and tightening, not authoring from nothing.

**The taxonomy is the design work.** Six categories, chosen because a beginner can tell
them apart at arm's length:

1. **Smooth and grey** — beech, hornbeam, holly
2. **Silver or white, peeling in papery strips** — birch
3. **Shiny, with horizontal bands** — the cherries (lenticels)
4. **Ridged and furrowed into vertical networks** — oak, ash, elm
5. **Flaking away in plates or patches** — plane, pine, sycamore
6. **Stringy or fibrous, shredding vertically** — yew, juniper, redwood, cedar

with **spiralling** as a modifier rather than a seventh bucket (sweet chestnut), since
it describes a direction, not a surface.

### The photographic rule

**Bark photographs are worthless without consistent scale.** A close crop of beech and
a wide shot of beech look like different species. Every bark image must be shot or
cropped to roughly the same field of view — about 20–30 cm of trunk at chest height —
or the comparison actively lies to the reader.

Two honesty requirements that follow, and both are the sort of thing this codebase
already does:

- Show **mature** bark and say so. Bark changes radically with age; a young oak is
  smooth and would be filed under category 1 by anyone comparing it to our photo.
- Where the young form genuinely misleads, the `young` field says so in a sentence.

### Sourcing

Extend `scripts/fetch-species-images.mjs` with a `bark` term set (`"{latin} bark"`,
`"{latin} trunk"`), and `src/lib/content/credits.json` gains a `bark` key per species.
The plumbing already exists and licence credits are already handled.

**Expect to hand-curate.** Commons bark search quality is variable and scale is
uncontrolled. Auto-fetch as a first pass, then pin exact `File:` titles — the script
already supports pinning — rejecting anything without a scale reference or shot on an
obviously young or atypical trunk. Budget roughly a day of curation for 50 species.
This is the long pole of the whole plan and the item most likely to ship at reduced
quality, so start it early and in parallel.

Payload: 50 species × 2 sizes adds roughly 3–5 MB to `static/images/species`, which is
currently 15 MB across 250 files. Lazy-loaded and only on species pages, so it is fine,
but it is not free.

### Surfaces

1. **Species page** — a Bark block with the photo and note, inside the existing
   `#spotting` section.
2. **Identify** — *"No leaves on it? Start with the bark"*, six texture cards, then a
   candidate list. Structurally identical to the existing three-step leaf key, so it
   reuses the `keyCandidates` pattern rather than inventing one.
3. **Quiz** — "whose bark is this?" becomes a free question type once the photos exist.

---

## 5. Item 5 — the quiz

### Generate it, do not author it

The content is already there and it is unusually rich. Every one of the 50 species
carries `spot`, `folklore`, `science`, `tell`, `quick`, `season`, `hint`, `latin`, plus
three photo variants and soon a fourth. Question types are *generators over existing
fields*, which means hundreds of questions and no new content debt.

| Type | Source field | Prompt |
|---|---|---|
| Name the tree | `-tree` / `-leaf` photo | photo → four names |
| Whose bark? | `-bark` photo | photo → four names |
| Spot the difference | `hint` | one-line description → which tree |
| Folklore | `folklore[].body` | a snippet → which tree |
| Science | `science[].body` | a snippet → which tree |
| Right now | `season[]` for the current season | what it is doing → which tree |
| One to tell | `tell` | the repeatable fact → which tree |

**Modes:** Name the trees · Folklore · Science · Mixed.
**Scope:** *My grove* (revision on what you have found) or *The whole guide* (learning
ahead). Default to the whole guide under five finds, then to the grove. This wires the
quiz directly to the deck in §3 and gives the grey cards a second purpose.

### Two correctness risks, both real

**Redaction.** Folklore and science prose names its own species constantly — oak's
folklore opens *"The oak was sacred to the thunder gods"*. Every snippet must have the
species' `name`, `latin` and every `aka` stripped and replaced with "this tree" before
display. This needs a `redact()` helper and a test that no generated prompt contains its
own answer. Without it the whole folklore mode is broken on day one.

**Ambiguous distractors.** The guide contains near-duplicate species *by design* —
English/sessile oak, silver/downy birch, hawthorn/blackthorn, small-leaved/common lime,
black/Lombardy poplar, the willows. A generic prompt plus a confusable distractor
produces a question with two defensible answers, and being marked wrong for a right
answer is the fastest way to lose a user's trust in a quiz.

Mitigation: pick distractors from the same `key`/`key2` bucket for difficulty, but
maintain an explicit `CONFUSABLE` pair list and never place both halves of a pair in the
same question unless the prompt distinguishes them. Test it.

### Mechanics — the quiz must not punish

`DESIGN.md` removed the streak and the badges deliberately: *"a number that goes up is a
chore, and it quietly punished a missed day"*. A quiz is the easiest place in the app to
reintroduce exactly that mistake.

- **Eight questions.** Short enough for a bus stop.
- **No timer. No streak. No leaderboard. No stored score history.**
- **A wrong answer teaches.** Do not just mark it red — show the one sentence that would
  have told you, linked to the species page anchor. This is the entire pedagogical value
  of the feature.
- **End of round:** *"Six of eight — here are the two you missed"*, with links, and a
  *try those two again* button.
- **Determinism.** Seed the shuffle from the date, matching the existing
  `factForDate(now)` and tree-of-the-day patterns. Rounds become reproducible, testable,
  and identical for everyone that day — which makes *"today's five"* on the Today page a
  natural share, in keeping with "share the tool, never the data". Note that the
  codebase already avoids `Math.random()` on purpose (`newId` in
  `src/lib/trees.svelte.ts`), so use a small seeded PRNG rather than reaching for it now.

Route: `/quiz`, deep-linkable.

---

## 6. Items 1 and 6 — the camera leaves, the escape hatch arrives

**These ship in the same release.** Removing photo ID without putting the Lens
instructions in leaves a hole where the app's answer to "I still don't know" used to be.

### Removed

- The camera button, `<input capture>`, and the photo card on `/identify`
- `/api/identify` and `src/lib/plantnet.ts`
- The Pl@ntNet attribution block (no longer using the service)
- `PLANTNET_API_KEY` **from Vercel** — it is currently set
- `shrinkImage` and the IndexedDB photo store, which also serve item 2

### What Identify becomes

Ordered as a genuine narrowing funnel, cheapest and most certain first:

1. **Three questions about the leaf** — the existing key, now the primary route
2. **Or start with the bark** — the new key from §4, and the only route that works in winter
3. **Where are you standing?** — the existing habitat narrowing, kept as-is
4. **Still stuck? Ask your phone** — new, and last

### The Lens / Look Up guidance

`DESIGN.md` already sets the rule: *point at the phone's own recogniser; never pretend
to drive it*, and *only on the platform where it is true*. That survives intact — but
the copy must change completely, because **there is no longer a photo in the app to long-press.**
The instructions now start from the user's own camera roll.

Detection: `src/lib/photos.ts` already has a pure, tested `saveCapability()`. Keep the
pure-function shape, widen it to
`detectPlatform(): 'ios' | 'android' | 'desktop-mac' | 'desktop-other'`, and rename the
module to `platform.ts` — with `saveToPhotos` deleted there is nothing photographic left
in it. The existing six tests carry over and gain a desktop case.

Copy per platform, and nothing shown that is not true of the device in hand:

- **iPhone / iPad** — take the photo, open it in Photos, tap ⓘ or swipe up, then the
  leaf icon for **Look Up – Plant**. Carry an honest caveat: Visual Look Up needs iOS 15
  or later and is not available in every region or language.
- **Android** — **Google Lens** sits in the Camera app, or open the photo in Google
  Photos and tap **Lens**.
- **Desktop** — right-click any image in Chrome and choose *Search image with Google*,
  or upload at images.google.com.

Two more things the copy must do, because they are what makes this ours rather than a
signpost to a competitor:

- **Say what these tools are bad at.** They are confident and often wrong on
  confusable natives, and they will happily name a garden cultivar that is not in any
  British wood.
- **Close the loop.** *"Then come back and check it against the spotting notes and the
  bark."* The escape hatch should return the user to the guide, not end the session.

Still refused, as before: `lens.google.com/uploadbyurl`, which needs the photo publicly
hosted. Nothing leaves the device.

Placement: a `<details>` at the foot of Identify, styled like the existing habitats
block. It is a last resort and should read as one.

---

## 7. Item 2 — removing watch-this-tree

The largest deletion, and the one with real consequences.

### Scope

| Deleted | Lines |
|---|---|
| `src/routes/trees/[id]/+page.svelte` | 948 |
| `src/routes/citizen-science/+page.svelte` | 289 |
| `src/lib/trees.svelte.ts` | 320 |
| `src/lib/phenology.ts`, `src/lib/records.ts` | — |
| `src/lib/components/ObsPhoto.svelte` | — |
| the Following half of `src/routes/trees/+page.svelte` | ~130 |
| roughly 250 of the 443 lines in `src/lib/trees.test.ts` | — |

**Callers that must be unpicked** (found by grep, all of them shallow):

- `src/routes/+page.svelte:8,26,74-100` — the "your trees, this week" block on Today
- `src/lib/missions.svelte.ts:34` — `foundInWindow` counts a tree observation *or* a
  grove find; drop the observation branch and the hunts keep working unchanged
- `src/lib/components/InstallPrompt.svelte:5` — celebrates on tagging a tree; the
  `grove.addFind` celebration remains, so the prompt keeps its trigger
- `src/lib/share.ts` — tree-timeline sharing goes; grove sharing stays
- `src/routes/+layout.svelte:9` — `requestPersistence()` exists to protect stored
  photos; with no photos it can go too

Also gone with it: the Nature's Calendar submission path, the postcode field — the only
place the app asks for anything approaching a location — and the `/citizen-science`
page. Worth noting that this makes the privacy story strictly simpler: after this work
the app holds a list of species ids and dates, and nothing else.

### Routes

`/trees/[id]` and `/citizen-science` will 404 for anyone with a bookmark. Add redirects
to `/grove` and `/learn`. `/near` is already a one-line stub and can be deleted outright.

---

## 8. The data question — the one genuinely irreversible step

Following stores real user data in two places: `mat-trees-v1` in localStorage, and the
`meet-a-tree / photos` IndexedDB store holding their own photographs. Deleting the
feature deletes photographs people took. Nothing else in this plan is irreversible;
this is.

**Recommended — two releases:**

1. **R1:** keep everything working, add *"Download your tree records"* to `/trees`
   (a JSON file plus the photos), with a line saying the feature is closing.
2. **R2:** remove the UI and the code, but leave the IndexedDB store **unread and
   undeleted**, so a reinstall or a late return does not silently lose the photos. Ship
   the export page at `/trees` as the only thing left there.
3. A later cleanup release drops the store.

**If you would rather do it in one:** ship the export screen at `/grove/export` and keep
it for a few months. The minimum acceptable version is that the data is recoverable by
someone who wants it.

**Or accept the loss** — the app is pre-launch, has no custom domain yet, and the real
user count may be small enough that this is ceremony. That is a legitimate call and it
is yours to make; I would not make it silently.

---

## 9. Consequences worth taking

**The app can go static again.** With `/api/identify` gone there is no server code left.
`adapter-vercel` → `adapter-static` makes the whole thing a static PWA: no API key, no
quota, no rate limiter, no server to be wrong about. That is item 1's spirit applied to
the infrastructure. Optional and not urgent — Vercel serves static happily — but it is
a real simplification.

**Service worker.** Bump the cache version and confirm nothing precaches the deleted
routes. Navigations are already network-first, which is what stops an installed copy
serving a stale shell for days, so there is no trap here as long as that stays true.

**Docs.** `README.md`, `ARCHITECTURE.md` and `DESIGN.md` all describe the current five
surfaces and will be wrong the moment Phase 3 lands. These have gone fifteen commits
stale once already. `DESIGN.md` specifically needs:

- two new rows in *Things deliberately removed* — photo identification, and following
- the *Interaction decisions* entry on pointing at the phone's recogniser rewritten for
  a world with no in-app photo
- the greyscale-not-opacity rule from §3, written down so the 2.33:1 regression cannot
  return
- the quiz-never-punishes rule from §5, as a sibling of the streak and badge removals

---

## 10. Sequencing

Five phases, one PR each, each shippable on its own with the Lighthouse accessibility
gate green.

| Phase | Work | Why here | Rough |
|---|---|---|---|
| **0** | Decisions: nav shape (§2), data policy (§8), bark taxonomy (§4) | Everything downstream branches on these | — |

| **1** | The grove deck (item 4) | Smallest, highest value, zero dependencies. Fixes the actual reported defect | ½ day |
| **2** | Bark content and photos (item 3) | The long pole. Curation runs in parallel with phases 3 and 4 | 1½–2 days |
| **3** | Camera out, Lens/Look Up in (items 1, 6) | One release, or Identify has a hole in it | ½ day |
| **4** | Following out, nav re-solved (item 2, §2) | After 3, so Identify has already settled | 1 day |
| **5** | Quiz (item 5) | Needs bark photos from 2 and the deck from 1 | 2 days |

Roughly six days of build, plus the bark curation running alongside.

### Definition of done, per phase

- Lighthouse accessibility **1.0** — the release gate, unchanged
- `svelte-check` and `vitest` green
- New pure logic is unit-tested: redaction, distractor ambiguity, platform detection
- Docs updated in the same PR as the code, not after it

---

## 11. What the build changed, and why

The plan survived mostly intact. Five departures are worth recording, because each
was a decision made against something the plan asserted.

**The deck's grey-to-colour moment could not work as described (§3).** Found and
unfound are separate blocks, so a card moving between them is destroyed and
rebuilt — a CSS transition on `filter` has nothing to transition from. Rather than
ship dead CSS, the store now carries a transient `justFound` flag that the deck
reads once and clears, and the card plays a one-shot animation on the visit that
earned it. The flag is deliberately not persisted: a reload is not a new find.

**"Still to find" is alphabetical, not in guide order.** The plan claimed the
guide's own order groups confusables together and that alphabetising would scatter
them. It does not: `species.ts` has always ended with `.sort()` by name, so guide
order *is* alphabetical. The claim was wrong and the code is unchanged.

**The bark key asks one question, not the plan's implied mirror of the leaf key.**
Six textures leave twenty species under "ridged and furrowed", which the plan
treated as a weakness. It is not worth fixing with a second question: the honest
follow-ups are things nobody in a wood in February can answer. Twenty photographs
on one screen is a better instrument than a question about fissure depth.

**Six species ship no bark photograph, where the plan assumed fifty.** Commons has
files under all six names and every one is the wrong plant, a young trunk, or a
duplicate. The UI degrades to the note alone and says why. Oak's photograph was
also pinned past the search's own pick, which was the only GFDL-1.2 image in the
app; everything now ships CC or public domain.

**The `/trees` redirect is a prerendered page, not a server redirect.** The old
stub used `prerender = false`, which makes `adapter-vercel` build a serverless
function for three lines of "go over there" — needless cost, no use offline, and
on Windows the symlink it needs fails the local build. A static page with a meta
refresh does the same job, and removing it left the app with no server routes at
all, which makes the `adapter-static` move in §9 available whenever it suits.

Two things the plan flagged as risks turned out to be real and are now guarded by
tests rather than by care: folklore prose names its own species constantly, and
the guide's near-duplicates would otherwise have produced questions with two
defensible answers.
