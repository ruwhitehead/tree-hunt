<script lang="ts">
	import { base } from '$app/paths';
	import { SPECIES, searchSpecies } from '$lib/content/species';
	import { missionsFor } from '$lib/content/missions';
	import { seasonOfMonth } from '$lib/season';
	import { install } from '$lib/install.svelte';
	import HowToInstall from '$lib/components/HowToInstall.svelte';

	/** The permanent route to the how-to.
	 *
	 *  Everywhere else it is offered, it can be snoozed away — three refusals and
	 *  the install bar never returns, by design. That left no way at all to find
	 *  out how to add the app afterwards, including for someone who said "not now"
	 *  three times in March and wants it in October. This asks nothing and is
	 *  simply always here, hidden only once the app is actually installed. */
	let howToOpen = $state(false);
	const showHowTo = $derived(!install.installed && !install.platform.standalone);

	let q = $state('');
	const results = $derived(searchSpecies(q));

	/** Species a hunt is actively looking for get the season spine and a marker.
	 *  Earned information, not decoration: it tells you what is findable today. */
	const now = new Date();
	const season = seasonOfMonth(now.getMonth());
	const inSeason = new Set(missionsFor(now).current.flatMap((m) => m.ids));
</script>

<svelte:head>
	<title>Learn · Tree Hunt</title>
	<meta name="description" content="Search the field guide: {SPECIES.length} trees of Britain and Ireland, each with how to spot it, its folklore and its science." />
</svelte:head>

<main class="view">
	<div class="vhead">
		<h1>Learn</h1>
		<span class="pill">{SPECIES.length} trees</span>
	</div>
	<p class="scope">The trees of <strong>Britain and Ireland</strong> — natives, long-established introductions, and the ones you actually meet on a street or a hillside.</p>

	<a class="seasonlink" href="{base}/missions/">Seasonal hunts — what to look for right now →</a>

	{#if showHowTo}
		<div class="card stonebg homescreen">
			<button class="hstoggle" onclick={() => (howToOpen = !howToOpen)} aria-expanded={howToOpen}>
				<img src="{base}/icons/icon-192.png" alt="" width="32" height="32" />
				<span class="hscopy">
					<span class="hst">Put Tree Hunt on your home screen</span>
					<span class="hsb">Opens like an app, works with no signal</span>
				</span>
				<span class="chev" aria-hidden="true">{howToOpen ? '−' : '+'}</span>
			</button>
			{#if howToOpen}
				<div class="hssteps"><HowToInstall /></div>
			{/if}
		</div>
	{/if}

	<search>
		<label class="searchbox">
			<span class="visually-hidden">Search for a tree by name</span>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" /></svg>
			<input
				type="search"
				bind:value={q}
				placeholder="Search a tree — oak, rowan, Quercus…"
				autocomplete="off"
				enterkeyhint="search"
			/>
			{#if q}
				<button class="clear" onclick={() => (q = '')} aria-label="Clear search">✕</button>
			{/if}
		</label>
	</search>

	<p class="samplenote" aria-live="polite">
		{#if q}
			{results.length} {results.length === 1 ? 'tree' : 'trees'} match “{q}”
		{:else}
			Every tree in the guide, with spotting notes, folklore and science.
		{/if}
	</p>

	{#if results.length === 0}
		<div class="card tint">
			<p class="serif" style="font-size:var(--text-base)">No tree by that name — yet.</p>
			<p class="sub">
				The guide covers {SPECIES.length} common British trees. Try a shorter word, a Latin name, or
				browse the full list by clearing the search.
			</p>
		</div>
	{/if}

	<ul class="list">
		{#each results as sp (sp.id)}
			<li>
				<a class="row-link" class:seasonal={inSeason.has(sp.id)} class:spring={inSeason.has(sp.id) && season === 'spring'} class:summer={inSeason.has(sp.id) && season === 'summer'} class:autumn={inSeason.has(sp.id) && season === 'autumn'} class:winter={inSeason.has(sp.id) && season === 'winter'} href="{base}/species/{sp.id}/">
					<span class="thumb">
						<img src="{base}/images/species/{sp.id}-thumb.webp" alt="" width="120" height="120" loading="lazy" decoding="async" />
					</span>
					<span class="text">
						<span class="n">{sp.name}</span>
						<span class="l">{sp.latin}</span>
						<span class="h">{sp.hint}</span>
							{#if inSeason.has(sp.id)}<span class="now">Findable now</span>{/if}
					</span>
					<span class="chev" aria-hidden="true">›</span>
				</a>
			</li>
		{/each}
	</ul>
</main>

<style>
	/* The toggle fills the card, so the card carries no padding of its own. No
	   `overflow: hidden` — it was there to clip the row to the rounded corners,
	   but the button has no background of its own to clip, and all it actually did
	   was turn a collapsed card into a clipped one and hide the real problem. */
	.homescreen {
		padding: 0;
	}
	.hstoggle {
		display: flex;
		align-items: center;
		gap: 11px;
		width: 100%;
		padding: 12px 14px;
		min-height: 44px;
	}
	.hstoggle img {
		width: 32px;
		height: 32px;
		display: block;
		flex: none;
	}
	.hscopy {
		min-width: 0;
		flex: 1;
	}
	.hst {
		display: block;
		font-size: var(--text-md);
		font-weight: 700;
		color: var(--ink);
	}
	.hsb {
		display: block;
		font-size: var(--text-sm);
		color: var(--soft);
	}
	.hstoggle .chev {
		font-size: var(--text-2xl);
		color: var(--deep);
		line-height: 1;
		flex: none;
	}
	.hssteps {
		padding: 0 14px 14px 4px;
	}
	.seasonlink {
		font-size: var(--text-md);
		font-weight: 700;
		color: var(--deep);
		text-decoration: none;
		background: var(--wash);
		border: 1px solid var(--wash-line);
		border-radius: 12px;
		padding: 11px 14px;
		min-height: 44px;
		display: flex;
		align-items: center;
	}
	.scope {
		margin: -4px 0 0;
		font-size: var(--text-md);
		color: var(--soft);
	}
	.scope strong {
		color: var(--ink);
	}
	.searchbox {
		display: flex;
		align-items: center;
		gap: 9px;
		background: var(--card);
		border: 1.5px solid var(--line);
		border-radius: 999px;
		padding: 0 14px;
		min-height: 50px;
	}
	.searchbox:focus-within {
		border-color: var(--green);
	}
	.searchbox svg {
		width: 19px;
		height: 19px;
		color: var(--soft);
		flex: none;
	}
	.searchbox input {
		flex: 1;
		border: none;
		background: none;
		font: inherit;
		font-size: var(--text-base);
		color: var(--ink);
		min-height: 46px;
		outline: none;
	}
	.searchbox input::placeholder {
		color: var(--soft);
	}
	.clear {
		font-size: var(--text-base);
		color: var(--soft);
		width: 34px;
		height: 34px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		flex: none;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 9px;
	}
	.row-link {
		display: flex;
		align-items: center;
		gap: 13px;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 14px;
		padding: 10px 12px;
		text-decoration: none;
		color: inherit;
		min-height: 66px;
		transition: transform 0.12s ease, border-color 0.12s ease;
	}
	.row-link:hover {
		border-color: var(--green);
	}
	.row-link:active {
		transform: scale(0.99);
	}
	.thumb {
		width: 54px;
		height: 54px;
		border-radius: 11px;
		overflow: hidden;
		flex: none;
		background: var(--stonewash);
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.text {
		flex: 1;
		min-width: 0;
	}
	.n {
		display: block;
		font-weight: 700;
		font-size: var(--text-md);
	}
	/* Caslon italic — Inter Tight has no italic face to give. */
	.l {
		display: block;
		font-family: var(--display);
		font-size: var(--text-sm);
		font-style: italic;
		color: var(--soft);
	}
	.h {
		display: block;
		font-size: var(--text-sm);
		color: var(--soft);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.row-link.seasonal {
		border-left-width: 4px;
	}
	.spring {
		border-left-color: #8fbf5a;
	}
	.summer {
		border-left-color: var(--green);
	}
	.autumn {
		border-left-color: #c8862f;
	}
	.winter {
		border-left-color: #6b7f8a;
	}
	.now {
		display: inline-block;
		margin-top: 3px;
		font-size: var(--text-2xs);
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--deep);
	}
	.chev {
		color: var(--soft);
		font-size: var(--text-2xl);
		flex: none;
	}
	@media (min-width: 700px) {
		/* minmax(0, 1fr), not bare 1fr: a 1fr track cannot shrink below its
		   content's min-content width, and the nowrap .h hint makes that the
		   longest hint in the column — wide enough to push the second column
		   clean out of the frame on desktop. Capping the minimum at 0 keeps the
		   columns equal and lets the ellipsis do its job. */
		.list {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.searchbox {
			max-width: 520px;
		}
	}
</style>
