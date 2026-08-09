<script lang="ts">
	import { base } from '$app/paths';
	import { SPECIES, speciesById } from '$lib/content/species';
	import type { Species } from '$lib/content/types';
	import { deckOrder, grove } from '$lib/grove.svelte';
	import { shareGrove } from '$lib/share';
	import Give from '$lib/components/Give.svelte';

	/** A wall of 50 grey cards reads as "you have failed 50 times". Until someone
	 *  has a few species, lead with the ones they can genuinely find on any
	 *  street, and keep the full list below. */
	const STARTERS = ['oak', 'sycamore', 'birch', 'holly', 'hawthorn', 'ash'];
	const starters = $derived(
		STARTERS.map((id) => speciesById(id)).filter((s): s is NonNullable<typeof s> => Boolean(s))
	);
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

</script>

<svelte:head>
	<title>My Grove · Meet a Tree</title>
	<meta
		name="description"
		content="The trees you have met, and the ones still to find — a field guide to {SPECIES.length} British and Irish trees that keeps track of what you know."
	/>
</svelte:head>

<!-- One card for both halves of the deck. A species you have not found yet shows
     the same photograph in grey and its real name: the point of the deck is to
     tell you what you are looking for, and a silhouette labelled "not yet met"
     told you nothing and led to Identify rather than to the tree.

     The grey is a CSS filter on the image alone. Fading the whole card was tried
     and shipped once, and the faded text failed contrast at 2.33:1 — which the
     Lighthouse accessibility gate caught. The name stays full-contrast ink in
     both states, and the tick is the shape that distinguishes them where colour
     cannot (mono vision, forced-colours mode, which drops filters entirely). -->
{#snippet deckcard(sp: Species, has: boolean)}
	<a class="spcard" class:tofind={!has} class:justfound={has && sp.id === justFound} href="{base}/species/{sp.id}/">
		<span class="pic sq">
			<img src="{base}/images/species/{sp.id}-thumb.webp" alt="" width="120" height="120" loading="lazy" decoding="async" />
			{#if has}
				<span class="tick" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
				</span>
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
			<p class="serif" style="font-size:15px">
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
		font-size: 20px;
		color: var(--deep);
		font-variant-numeric: tabular-nums;
	}
	.stat .unit {
		font-size: 11px;
	}
	.stat .l {
		font-size: 9.5px;
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
	/* colour is the reward for finding it. Only the photograph greys out — never
	   the text, and never via opacity. */
	.spcard.tofind .pic.sq img {
		filter: grayscale(1);
	}
	/* The one moment the app still has to give, now that the camera and the tree
	   timeline have gone: the card you just earned arrives in colour. A plain CSS
	   transition cannot do this — found and unfound are separate blocks, so the
	   card is rebuilt rather than restyled — hence a one-shot animation.

	   No fill mode on either: once the animation ends the resting styles are
	   already right (the card is in `found`, so nothing greys it), and a
	   `forwards` fill would pin the transform and kill the card's press state. */
	.spcard.justfound {
		animation: pop 520ms ease;
	}
	.spcard.justfound .pic.sq img {
		animation: intocolour 900ms ease;
	}
	@keyframes intocolour {
		from {
			filter: grayscale(1);
		}
		to {
			filter: grayscale(0);
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
		.spcard.justfound,
		.spcard.justfound .pic.sq img {
			animation: none;
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
		font-size: 11.5px;
		font-weight: 700;
		line-height: 1.25;
	}
	.sl {
		font-size: 9.5px;
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
		font-size: 14px;
	}
	.shint {
		display: block;
		font-size: 12px;
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
