# Design

Why the app looks and behaves as it does. The decisions to *remove* things matter as much as the
additions, so they are recorded here too.

## What the app is for

**Learning to name the trees you walk past.** The app teaches recognition, shows you what you have not
learned yet, and tests you on it. The giving ask exists because someone who comes to care may want to
plant a real one.

> **This replaced an earlier answer, and the change is the reason for most of what follows.** The app was
> once built around *attachment to a specific, individual tree* — a particular oak at the end of a
> particular road, followed through a year. That is a lovely idea and most people did not do it. Around it
> had accreted five jobs: identify a tree for you, follow one, submit records to a national scheme, collect
> species, and teach. Cutting the two most expensive tools left one honest job. See
> [REDESIGN.md](REDESIGN.md).

Two consequences worth stating plainly, because they constrain everything else:

- **We do not answer the question for you.** No camera, no photo matching. Keys, notes and photographs
  that let you answer it yourself, and — when those genuinely fail — directions to the recogniser already
  on your phone, described honestly, including what it is bad at.
- **We are not a logbook.** What is stored is a list of species ids and dates. No accounts, no uploads,
  no location asked for, nothing that a cleared browser makes irreplaceable.

## Brand: an ITF echo, made accessible

Colours were read from `internationaltreefoundation.org`'s own stylesheets rather than guessed:

| Token | Value | Role |
|---|---|---|
| `--green` | `#167E3C` | ITF's green. Buttons, the found-tick, giving surfaces |
| `--forest` | `#1C3B23` | ITF's dark green. Depth, folklore |
| `--stone` | `#E1DFD9` | ITF's warm stone. Calm surfaces |
| `--ink` | `#1E1E1E` | ITF's body colour |
| `--deep` | `#0E5C2B` | **derived.** ITF's green fails AA on tinted grounds, so small text uses this |
| `--deep` (dark) | `#7CC98F` | dark-theme accent, 8:1 on forest grounds |

That derived green is the single most important token: ITF's brand green only just passes AA on white and
fails on our washes, so **brand green is never small text**. Every pair is AA or better in both themes.

### Type

ITF set headings in Adobe Caslon Pro and body in Inter Tight. We use **Inter Tight exactly**, and
**Libre Caslon Text** — an open Caslon revival — for display, so the app reads as theirs without a
commercial licence.

The split is by *purpose*, not decoration:

- **Spotting notes are instructions**, read standing under a tree: Inter Tight, 16px, full-contrast ink.
- **Folklore is storytelling**: Libre Caslon Text, 17px. It is the reason someone falls for a tree rather
  than merely naming it, so it reads as prose.
- Numbers that line up get `tabular-nums`.

## The identity: a modern field notebook

This direction survived being argued against, which is why it is worth writing down.

**The proposal** was to make the hand-drawn leaf silhouettes — the most characterful thing in the app —
into its visual language: dividers, badges, loading states, section markers.

**The challenge:** *"You are proposing a mascot, not an identity. Those silhouettes are diagrams; they
exist to teach leaf shape in the key. Reuse them as decoration and they stop reading as information. And
you are fixing the wrong thing — the app looks generic because the photographs are inconsistent, not
because it lacks ornament. What actually distinguishes it is a thousand words of real writing per tree and
dated records nobody else has."*

**The resolution**, in priority order:

1. **Photographic discipline first.** One crop geometry throughout (900×675, 240×240), and every one of the
   50 species chosen by eye from contact sheets. This mattered more than any ornament.
2. **The season spine is the motif** — a 4px coloured left border: spring `#8FBF5A`, summer `--green`,
   autumn `#C8862F`, winter `#6B7F8A`. It appears on tree timelines, species calendars, seasonal hunts and
   guide rows, and it earns its place because the colour carries information. One shared
   `seasonOfMonth()` backs all of them so a given green always means the same thing.
3. **The Caslon/Inter split is the voice.**
4. **Leaf silhouettes stay strictly diagrammatic** — the challenger was right.

## Standing rules

- **Never information by colour alone.** The season spine always sits beside a date, an event name or a
  "findable now" label.
- **Never a paywall.** A locked feature turns an enthusiast into an ex-user. Everything is free forever.
- **Never invent impact figures.** ITF deliberately publish no "£X plants Y trees" claim, so neither do we.
  Their actual strongest ask — a monthly gift matched for the first 12 months — is quoted instead, in their
  words, with their real programmes named (West Pokot, Dundori, Mutaluni).
- **One ask, not four.** Four vague donate links became one `Give` component.
- **Ask for no permissions at all.** There is nothing left that needs one: no camera, no location, no
  storage-persistence ask. Notifications are not implemented and would come after a week of use, never on
  arrival.
- **Prefer removing a concept to adding one.**
- **Lighthouse accessibility 100 is a release gate**, not an aspiration.
- **Grey the photograph, never the text.** Unfound cards in the deck grey out via `filter: grayscale()` on
  the image alone. Fading the whole card was tried and shipped once, and the faded label failed contrast at
  **2.33:1** — caught by the gate above. Names stay full-contrast ink in both states, and a tick, not a
  colour, is what tells found from unfound where filters do not apply (mono vision, forced-colours mode).
- **Nothing that keeps score.** The streak and the badges were removed for punishing people, and the quiz
  is the easiest place to smuggle them back: no timer, no streak, no stored history, no percentage. A
  wrong answer's job is to teach, so it shows the line that would have given it away and links to it.
- **A photograph of the wrong species is worse than none.** Where Commons offers only the wrong plant or a
  misleading specimen, the slot ships empty and the page says why.

## What survived the citizen-science tie-in

Submitting phenology records to Nature's Calendar went with Following, and with it a whole section of
rules that used to live here. Three of them were never really about citizen science, and still hold:

- **Explain at the moment of intent.** Six words where the decision is made beat sixty on a card above it.
  This is why the bark key labels a texture with what you would feel rather than explaining bark first, and
  why a wrong quiz answer teaches at the point of being wrong.
- **An explainer must be able to finish.** Standing text that never changes becomes furniture. Anything
  that explains should either collapse once it has been understood or be somewhere you chose to go — which
  is why the Lens instructions are a closed `details` at the foot of the page.
- **Sourced or silent.** Verified figures only; an unverifiable claim is left out entirely. It applied to
  `projects.ts`, which is gone, and it still applies to every number in the guide.

The rest — the "recorded nationally" tag, the contribution count, the postcode asked up front, the
`/citizen-science/` depth page — described machinery that no longer exists, and is recorded in the git
history rather than here.

## Things deliberately removed

| Removed | Why |
|---|---|
| **The streak** | A number that goes up is a chore, and it quietly punished a missed day — contradicting "generosity, not guilt". Personal records do the same job with substance: *"first leaves 10 days earlier than last year"*. |
| **Badges** | Generic gamification ("First Find", "Ten Trees"), and redundant once records said something true. |
| **"Near You"** | Read-once and inert. Without location it offered no insight; with location it would have shown patchy decades-old GBIF records as if they were fact. Its habitat guidance moved into Identify, where it helps at the moment you are narrowing candidates. |
| **The My Grove tab** | Two tabs for one idea that nobody could tell apart — my error for building both. Merged into My Trees as a second view, which freed a tab for Seasons. |
| **Four cards on Today** | Each existed only to say "there is a tab for this". Ten blocks became five: one thing to read, one tree to meet, your trees, the ask, the lockup. |
| **Photo identification** | It worked — the Pl@ntNet key was live — which is why cutting it was a decision rather than a tidy-up. It answered the question instead of teaching anyone to answer it, and that is the opposite of what the rest of the guide is for. The three keys and an honest signpost to Google Lens and Visual Look Up replace it. |
| **Following a tree through the year** | The observation timeline, the phenology mapping, the Nature's Calendar submissions, the citizen-science explainer, the photo store. About 1,700 lines. A good idea most people did not use, and it made the app a logbook as well as a guide. The *data* was not removed with it — see below. |
| **The camera FAB** | The raised green button was the camera's affordance. With the camera gone the bar went flat rather than promoting something else into the hole: promoting a destination because a slot came free is how navigation rots. |
| **Seasons as a tab** | It answers the same question as Today — what is worth doing now — and Today had just lost its own trees block. The live hunt surfaces there; the full board stays at `/missions`, off the bar, the way Learn's depth is. |
| **Asking for storage persistence** | Only ever requested to stop the browser evicting people's photographs. There are no photographs. |

## Interaction decisions

- **App-shell layout.** Content scrolls *inside* `main`, with the tab bar a static sibling. A sticky bar
  always covers whatever scrolls beneath it — an accessibility failure and an annoyance when the covered
  thing is a link.
- **Tabs replace history.** Switching tabs uses `data-sveltekit-replacestate`, so Back never walks a trail
  of tab switches and the first Back from the app root exits cleanly.
- **Install nudging is patient.** Asked from the second visit, or immediately after a delight moment
  (tagging a tree, adding a species) because that is when someone wants the app kept. "Not now" snoozes for
  four days; three refusals is a final no. It renders on every screen, since most arrivals come via a
  shared species link.
- **iOS honesty.** A photo taken in a browser never reaches the Photos library, so the app says so and
  offers "Save to Photos" via the share sheet — the only route in, and it cannot be automated.
- **Point at the phone's own recogniser; never pretend to drive it.** Visual Look Up and Google Lens have no
  web API, so Identify signposts them and never offers a button. It is the last thing on the page, closed,
  below all three keys, because it sends someone out of the app. Only the instructions true of the device in
  hand are rendered, and a test asserts each platform gets its own — an iPhone owner is not shown Chrome's
  right-click menu. Desktop now gets a route too, which it never used to: the old rule that a Mac gets no
  hint existed because the photo lived in the app, and the photo no longer does, so uploading to Lens works
  anywhere. The copy says what these tools are **bad** at — confusable natives, garden cultivars — and sends
  the reader back to the spotting notes. An escape hatch should return you to the guide, not end the session.
  `lens.google.com/uploadbyurl` would work but requires the photo to be publicly hosted, so it is still
  refused outright: nothing here leaves the device.
- **The deck names what you have not found.** It used to hide it — a generic silhouette labelled "Not yet
  met", linking to Identify rather than to the tree, so the one thing a collection deck is for it could not
  do. Unfound species now show the same photograph in grey with their real name, and tap through.
- **One question for bark, not three.** The leaf key divides three times because leaves genuinely do.
  Pushed past one question, bark starts asking things nobody standing in a wood in February can answer —
  *is that fissure deep or shallow* — so it asks once and then shows twenty photographs. Matching a trunk
  against a wall of pictures is a task people are good at; self-reporting a texture is not.
- **Keys are ordered by certainty, not by cleverness.** Leaf questions, then bark, then where you are
  standing, then the phone. Each is cheaper and surer than the next.
- **Retiring a feature is not licence to delete what people made — unless nobody made anything.** Following
  was withdrawn with an export, on the first half of that rule. The second half then applied: the app is
  unreleased and nobody had used it, so the export was noise on the page and the leftovers were orphaned
  megabytes in strangers' browsers with no code left to read them. `legacy-cleanup.ts` clears them. The
  order matters — the default is to keep, and "nobody used it" has to be established, not assumed.
- **Empty states are designed, not described.** A new tree shows an outlined ghost timeline of what a year
  will look like; a new grove leads with six trees on every British street rather than 50 grey silhouettes.
- **Never name an event the calendar only guessed.** A tree with no season dates recorded is asked for a
  note, not for "first ripe fruit" — that phrase in early August is the month talking, and the guide's own
  calendar says an oak then has *green* acorns swelling. Open the note and the species' seasonal paragraph
  appears as the example of what is worth writing down. Plain notes carry no season meaning, so they do not
  unlock event naming either.
- **A hunt asks for a sighting, not a species you own.** Boards count records dated inside their window, so
  a species met in April is genuinely still out there in July. That read as a broken 0/5 with no way to move
  it, so each candidate now carries **Seen it** and says why it is still listed. Re-sightings append a
  second dated find; the species tally is a set, so nothing double-counts.

## Voice

Plain, specific, unhurried. Hyphens rather than em dashes in UI copy where it reads better; no exclamation
marks; no emoji as section markers (a couple survive as deliberate warmth in toasts). Every species ends
with a "one to tell" — a fact written to be repeated aloud, because that is how the app spreads.

Errors say what happened and what to do: *"Today's identifications are used up. The questions below don't
use it at all."*

## Open design questions

- **Photographic treatment.** Geometry is consistent and sources are curated, but there is no grade or
  filter unifying ~144 photographs from as many photographers. The deck's greyscale now makes the
  inconsistency more visible, not less, because half the grid is desaturated at any time.
- **The habit shots are the weaker half.** A few are compromises — alder is foliage rather than a whole
  tree, black poplar is bare, the lime avenue has a road sign in it.
- **Bark magnification is uncontrolled.** Every bark image is centre-cropped square so nothing is made
  *worse*, but the source photographers stood where they liked, and a tight beech beside a wide beech still
  reads as two species. This is the largest remaining content debt: it wants a human pass with
  `BARK_PINS`. Only Lombardy poplar still lacks a photograph entirely.
- **No comparison view.** The content names confusable pairs (English vs sessile oak, blackthorn vs
  hawthorn), the quiz now has a formal list of them, and the bark key puts them on one screen — but there
  is still no deliberate side-by-side, which would be the most useful reference feature left.
- **Seasonal chrome.** The app looks identical in February and August; the season is known and used only by
  the spine, the hunts and one quiz question type.
- **Does the quiz need a way back in?** It has no streak by design, which also means it has no reason to
  return. "Today's five" on the home page, seeded by the date and identical for everyone, would be a pull
  without a punishment — but it is one step from a streak, so it is not built yet.
