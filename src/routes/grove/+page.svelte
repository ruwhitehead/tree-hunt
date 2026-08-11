<script lang="ts">
	import { base } from '$app/paths';
	import { SPECIES, starterSpecies } from '$lib/content/species';
	import type { Species } from '$lib/content/types';
	import { deckOrder, grove } from '$lib/grove.svelte';
	import { shareGrove } from '$lib/share';
	import Give from '$lib/components/Give.svelte';
	import CrownShape from '$lib/components/CrownShape.svelte';

	/** A wall of 50 grey cards reads as "you have failed 50 times". Until someone
	 *  has a few species, lead with the ones they can genuinely find on any
	 *  street, and keep the full list below. The six live in `species.ts` because
	 *  the strip on Today opens with the same ones. */
	const starters = starterSpecies();
	const showStarters = $derived(grove.speciesCount < 3);

	/** The deck in two blocks. Found first, newest meeting at the front, so the
	 *  last win is the first thing you see; still-to-find keeps SPECIES order,
	 *  which `species.ts` already sorts by name, so the block someone scans for a
	 *  tree they have just seen stays alphabetical. */
	const deck = $derived(deckOrder(SPECIES, (id) => grove.firstFound(id)));

	/** Adding a species navigates here from its own page, so by the time the deck
	 *  renders the card is simply already in colour and the find passes unmarked.
	 *  Read the flag once and clear it, so the card plays its arrival exactly on
	 *  the visit that earned it and never again on a reload. */
	const justFound = grove.justFound;
	$effect(() => {
		grove.justFound = null;
	});

	/** Bring the earned card to the reader, then let it come into colour.
	 *
	 *  Measured before this existed: the card lands 280px BELOW the fold on arrival,
	 *  and its animation was firing at 0ms while off-screen — so the one celebration
	 *  the app had was played to nobody, every single time, and finding a tree felt
	 *  like filing a form.
	 *
	 *  Two steps, deliberately separate. Scroll the card into the middle of the
	 *  view; then start the animation only once it is genuinely on screen, via an
	 *  observer rather than a guessed delay, because smooth-scroll duration is not
	 *  knowable and a timer would sometimes lose the race again. If the observer is
	 *  unavailable we simply play immediately: a celebration seen slightly early
	 *  beats one never seen. */
	let playing = $state(false);

	$effect(() => {
		if (!justFound || typeof window === 'undefined') return;
		const el = document.querySelector('.spcard.justfound');
		if (!el) return;

		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });

		// The observer is the good path: it starts the animation the moment the card
		// is genuinely on screen, however long the scroll took. The timer is the
		// honest one. IntersectionObserver and smooth scrolling both ride the
		// rendering pipeline, and there are real conditions where neither runs — a
		// backgrounded tab, a browser that never animates the scroll. Without a
		// fallback the celebration would then never play at all, which is worse than
		// the bug being fixed. Whichever wins, it plays exactly once.
		let done = false;
		const start = () => {
			if (done) return;
			done = true;
			playing = true;
		};

		const io =
			typeof IntersectionObserver === 'undefined'
				? null
				: new IntersectionObserver(
						(entries) => {
							if (entries.some((e) => e.isIntersecting)) {
								start();
								io?.disconnect();
							}
						},
						{ threshold: 0.6 }
					);
		io?.observe(el);
		// long enough for a smooth scroll to land, short enough not to feel detached
		const fallback = setTimeout(start, 900);

		return () => {
			clearTimeout(fallback);
			io?.disconnect();
		};
	});
</script>

<svelte:head>
	<title>My Grove · Tree Hunt</title>
	<meta
		name="description"
		content="The trees you have met, and the ones still to find — a field guide to {SPECIES.length} British and Irish trees that keeps track of what you know."
	/>
</svelte:head>

<!-- One card for both halves of the deck. A species you have not found yet shows
     its crown silhouette and its real name; found, it shows the photograph.
     Either way the NAME is there, which is the thing the deck exists for and
     the thing the old "Not yet met" card withheld.

     The silhouette replaced a greyed-out photograph. Grey was not a contrast
     failure — the tick, the names and the counted headings all carried the
     distinction, and the gate passed — but it was still a colour signal, and
     forced-colours mode drops CSS filters outright, so in that mode the two
     states were identical. An SVG in `currentColor` cannot fail that way.

     It is also the better picture. A desaturated thumbnail of a crown tells you
     almost nothing; the profile of the tree is how you name one across a field,
     and it is readable in winter. And the unfound half of the deck — usually
     most of it — now costs no image requests at all. -->
{#snippet deckcard(sp: Species, has: boolean)}
	<a
		class="spcard"
		class:tofind={!has}
		class:justfound={has && sp.id === justFound}
		class:playing={playing && has && sp.id === justFound}
		href="{base}/species/{sp.id}/"
	>
		<span class="pic sq">
			{#if has}
				<img src="{base}/images/species/{sp.id}-thumb.webp" alt="" width="120" height="120" loading="lazy" decoding="async" />
				<span class="tick" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
				</span>
				{#if sp.id === justFound}
					<!-- The card's own previous state, held on top until it dissolves. This is
					     what makes it a transformation rather than a fade-in: a second ago this
					     species WAS this silhouette, and the photograph arrives out of its own
					     outline. Found and unfound are separate branches, so without keeping
					     the shape here the card is simply rebuilt with nothing to morph from.

					     Rendered LAST so it covers the tick as well as the photo. The tick
					     means "found", so it belongs to the after state and should be revealed
					     with the photograph, not sitting on the silhouette announcing the
					     answer early. -->
					<span class="ghost" aria-hidden="true"><CrownShape shape={sp.crown} /></span>
				{/if}
			{:else}
				<CrownShape shape={sp.crown} />
			{/if}
		</span>
		<span class="sn">
			{sp.name}<span class="visually-hidden">{has ? ' — found' : ' — not found yet'}</span>
		</span>
		<span class="sl">{sp.latin}</span>
	</a>
{/snippet}

<main class="view">
	<div class="vhead">
		<h1>My Grove</h1>
		{#if grove.speciesCount}
			<button class="pill" onclick={shareGrove}>Share</button>
		{/if}
	</div>

	<div class="stats">
		<div class="stat"><div class="n">{grove.speciesCount}</div><div class="l">of {SPECIES.length}</div></div>
		<div class="stat"><div class="n">{grove.co2 ? `~${grove.co2}` : '0'}<span class="unit">kg</span></div><div class="l">CO₂ / yr</div></div>
		<div class="stat"><div class="n">{SPECIES.length - grove.speciesCount}</div><div class="l">to find</div></div>
	</div>

	{#if showStarters}
		<div class="card tint">
			<p class="label">Six to start with</p>
			<p class="serif" style="font-size:var(--text-base)">
				These six are on almost every British street and in almost every hedge. Learn them and you
				have most of what you will meet on an ordinary walk.
			</p>
		</div>
		<ul class="starters">
			{#each starters as sp (sp.id)}
				<li>
					<a class="starter" class:met={grove.has(sp.id)} href="{base}/species/{sp.id}/">
						<img src="{base}/images/species/{sp.id}-thumb.webp" alt="" width="120" height="120" loading="lazy" />
						<span class="stext">
							<span class="sname">{grove.has(sp.id) ? `✓ ${sp.name}` : sp.name}</span>
							<span class="shint">{sp.hint}</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	{#if deck.found.length}
		<p class="label" style="margin-top:6px">Found · {deck.found.length}</p>
		<div class="grid">
			{#each deck.found as sp (sp.id)}{@render deckcard(sp, true)}{/each}
		</div>
	{/if}

	{#if deck.unfound.length}
		<p class="label" style="margin-top:6px">Still to find · {deck.unfound.length}</p>
		<div class="grid">
			{#each deck.unfound as sp (sp.id)}{@render deckcard(sp, false)}{/each}
		</div>
	{/if}

	<Give />
</main>

<style>
	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}
	.stat {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 10px 4px;
		text-align: center;
	}
	.stat .n {
		font-family: var(--display);
		font-size: var(--text-2xl);
		color: var(--deep);
		font-variant-numeric: tabular-nums;
	}
	.stat .unit {
		font-size: var(--text-xs);
	}
	.stat .l {
		font-size: var(--text-2xs);
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--soft);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 9px;
	}
	.spcard {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 14px;
		padding: 8px 8px 10px;
		text-align: center;
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		gap: 2px;
		transition: transform 0.12s ease, border-color 0.12s ease;
	}
	.spcard:hover {
		border-color: var(--green);
	}
	.spcard:active {
		transform: scale(0.96);
	}
	.pic.sq {
		aspect-ratio: 1;
		width: auto;
		margin-bottom: 5px;
		position: relative;
		border-radius: 12px;
		overflow: hidden;
		background: var(--stonewash);
	}
	.pic.sq img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	/* the silhouette sits on the same wash the photo would, drawn in a tone that
	   is legible without competing with the found half of the deck */
	.spcard.tofind .pic.sq {
		background: var(--wash);
		color: var(--deep);
		display: grid;
		place-items: center;
	}
	/* The one moment the app still has to give, now that the camera and the tree
	   timeline have gone: the card you just earned arrives as a photograph.

	   Everything below is gated on `.playing`, not `.justfound`, because the card
	   starts life 280px below the fold. It used to animate on render, off-screen,
	   finishing before anyone could scroll to it — the celebration existed and was
	   never once seen. The page now scrolls the card into view and an observer
	   starts this when it is actually being looked at.

	   No fill mode: once it ends the resting styles are already right, and a
	   `forwards` fill would pin the transform and kill the card's press state. */
	.spcard.playing {
		animation: pop 520ms ease;
	}
	/* The silhouette holds the frame, then gives way. Opaque by DEFAULT, not
	   transparent: the card has to look unfound until the moment it is revealed, and
	   starting at zero made the silhouette flash into view before dissolving, which
	   read as a glitch rather than a reveal. `forwards` keeps it gone afterwards.

	   It only ever renders for the one just-found card, and only when JS is running
	   — `justFound` is client state set by a tap — so there is no no-JS path where
	   this could strand a photograph behind a permanent slab. */
	.ghost {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		background: var(--wash);
		color: var(--deep);
		opacity: 1;
	}
	.spcard.playing .ghost {
		animation: dissolve 620ms ease forwards;
	}
	.spcard.playing .pic.sq img {
		animation: intocolour 900ms cubic-bezier(0.22, 0.9, 0.3, 1);
	}
	@keyframes dissolve {
		0%,
		18% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
	/* Zoom in, then settle back out. The push to 1.07 is what reads as "found it";
	   returning to 1 is what stops it reading as a game show. Kept under 8% because
	   the thumbnail is 120px and any more turns a photograph into mush. */
	@keyframes intocolour {
		0% {
			opacity: 0;
			transform: scale(1);
		}
		45% {
			opacity: 1;
			transform: scale(1.07);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}
	@keyframes pop {
		0% {
			transform: scale(0.94);
		}
		60% {
			transform: scale(1.03);
		}
		100% {
			transform: scale(1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spcard.playing,
		.spcard.playing .pic.sq img {
			animation: none;
		}
		/* Not merely `animation: none` — the silhouette is opaque by default and the
		   dissolve is the only thing that clears it, so switching the animation off
		   would leave it covering the photograph for good. Someone who asked for less
		   motion should get the finished card, not a permanent grey square. */
		.ghost {
			display: none;
		}
	}
	/* Forced colours strips backgrounds and can leave the silhouette overlay as an
	   opaque slab sitting on the photograph, since its dissolve is the only thing
	   that removes it. Keep it out of the way entirely — this is the same trap the
	   deck hit when the unfound half was greyscale: filters and backgrounds are the
	   first things forced-colours takes away. */
	@media (forced-colors: active) {
		.ghost {
			display: none;
		}
	}
	.tick {
		position: absolute;
		right: 4px;
		bottom: 4px;
		width: 19px;
		height: 19px;
		border-radius: 50%;
		background: var(--green);
		color: #fff;
		display: grid;
		place-items: center;
		box-shadow: 0 1px 3px rgba(20, 30, 22, 0.4);
	}
	.tick svg {
		width: 12px;
		height: 12px;
	}
	.sn {
		font-size: var(--text-xs);
		font-weight: 700;
		line-height: 1.25;
	}
	/* Caslon italic: the only real italic in the app. This was the worst case of
	   the synthetic one — a sheared sans at 9.5px, on the deck card, which is
	   where a binomial is read most often. */
	.sl {
		font-family: var(--display);
		font-size: var(--text-2xs);
		font-style: italic;
		color: var(--soft);
	}
	.starters {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 9px;
	}
	.starter {
		display: flex;
		align-items: center;
		gap: 12px;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 14px;
		padding: 9px 12px;
		min-height: 62px;
		text-decoration: none;
		color: inherit;
	}
	.starter:hover {
		border-color: var(--green);
	}
	.starter.met {
		background: var(--wash);
		border-color: var(--wash-line);
	}
	.starter img {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		object-fit: cover;
		flex: none;
	}
	.stext {
		min-width: 0;
	}
	.sname {
		display: block;
		font-weight: 700;
		font-size: var(--text-md);
	}
	.shint {
		display: block;
		font-size: var(--text-sm);
		color: var(--soft);
	}
	@media (min-width: 700px) {
		.starters {
			grid-template-columns: 1fr 1fr;
		}
		.grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}
	@media (min-width: 900px) {
		.grid {
			grid-template-columns: repeat(6, 1fr);
		}
		.stats {
			max-width: 620px;
		}
	}
</style>
