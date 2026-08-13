<script lang="ts">
	/**
	 * Six trees on Today, in the two states the deck already uses: a crown
	 * silhouette for a species you have not met, its photograph once you have.
	 *
	 * It does two jobs at once, which is why it is one element rather than two.
	 * To someone who has just dismissed the intro it is the first step the home
	 * page otherwise never offered — a fact, a featured tree and a donation ask
	 * are not a thing to *do*. To everyone else it is the only place outside the
	 * grove where progress is visible, and it puts six photographs on a page that
	 * had one.
	 *
	 * The row leads with the starter trees you have not met, then backfills with
	 * what you have found most recently. So it opens as a curriculum, and turns
	 * into your own trees as you learn them, without ever changing shape. The
	 * explaining line goes once you have a tree, per DESIGN.md: an explainer must
	 * be able to finish.
	 *
	 * Silhouette-or-photograph is a difference in the picture itself, not a
	 * colour signal, so it survives forced-colours mode — the same reasoning that
	 * put crowns in the deck. Names are full-contrast ink in both states, and the
	 * state is said in words for a screen reader.
	 */
	import { base } from '$app/paths';
	import { SPECIES, starterSpecies } from '$lib/content/species';
	import { grove } from '$lib/grove.svelte';
	import CrownShape from '$lib/components/CrownShape.svelte';

	const SLOTS = 6;

	const row = $derived.by(() => {
		const unmet = starterSpecies().filter((s) => !grove.has(s.id));
		const met = SPECIES.filter((s) => grove.has(s.id)).sort((a, b) =>
			(grove.firstFound(b.id) ?? '').localeCompare(grove.firstFound(a.id) ?? '')
		);
		return [...unmet, ...met].slice(0, SLOTS);
	});

	const empty = $derived(grove.speciesCount === 0);
</script>

<section class="strip" aria-labelledby="strip-title">
	<p class="label" id="strip-title">{empty ? 'Start here' : 'My trees'}</p>

	{#if empty}
		<p class="serif blurb">
			These six are on almost every street and in almost every hedge. Learn them and you can name
			most of what an ordinary walk puts in front of you.
		</p>
	{/if}

	<ul class="row">
		{#each row as sp (sp.id)}
			{@const has = grove.has(sp.id)}
			<li>
				<a href="{base}/species/{sp.id}/">
					<span class="pic" class:tofind={!has}>
						{#if has}
							<img
								src="{base}/images/species/{sp.id}-thumb.webp"
								alt=""
								width="120"
								height="120"
								loading="lazy"
								decoding="async"
							/>
						{:else}
							<CrownShape shape={sp.crown} size={40} />
						{/if}
					</span>
					<span class="nm"
						>{sp.name}<span class="visually-hidden">{has ? ' — found' : ' — not found yet'}</span
						></span
					>
				</a>
			</li>
		{/each}
	</ul>

	<a class="more" href="{base}/grove/">
		<strong>{grove.speciesCount} of {SPECIES.length}</strong> met — see the whole deck →
	</a>
</section>

<style>
	.strip {
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 14px 15px;
	}
	.blurb {
		font-size: var(--text-base);
		margin: 0 0 12px;
		color: var(--ink);
	}
	.row {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 7px;
	}
	.row a {
		display: block;
		text-decoration: none;
		color: inherit;
	}
	.pic {
		display: grid;
		place-items: center;
		aspect-ratio: 1;
		border-radius: 10px;
		overflow: hidden;
		background: var(--stonewash);
		margin-bottom: 5px;
	}
	.pic img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	/* the same ground and tone the deck gives an unmet crown, so a tree looks the
	   same here as it does there */
	.pic.tofind {
		background: var(--wash);
		color: var(--deep);
	}
	.row a:hover .pic {
		outline: 2px solid var(--green);
		outline-offset: 1px;
	}
	.row a:active .pic {
		transform: scale(0.95);
	}
	.nm {
		display: block;
		font-size: var(--text-2xs);
		font-weight: 700;
		line-height: 1.2;
		text-align: center;
		/* two lines is enough for every starter name and for the longest species
		   name that can reach this row, and a fixed height keeps the six tiles
		   bottom-aligned whether a name wraps or not */
		height: 2.4em;
		overflow: hidden;
	}
	.more {
		display: block;
		margin-top: 12px;
		font-size: var(--text-md);
		color: var(--soft);
		text-decoration: none;
	}
	.more strong {
		color: var(--deep);
		font-variant-numeric: tabular-nums;
	}
	.more:hover {
		color: var(--deep);
	}
	@media (prefers-reduced-motion: reduce) {
		.row a:active .pic {
			transform: none;
		}
	}
	@media (min-width: 700px) {
		.nm {
			font-size: var(--text-xs);
		}
	}
</style>
