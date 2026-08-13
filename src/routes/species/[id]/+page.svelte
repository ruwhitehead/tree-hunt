<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import SpeciesPhoto from '$lib/components/SpeciesPhoto.svelte';
	import { barkLabel, hasBarkPhoto } from '$lib/content/bark';
	import { fruitLabel, hasOrganPhoto } from '$lib/content/organs';
	import { grove } from '$lib/grove.svelte';
	import { shareSpecies } from '$lib/share';

	/** Months the fruit is actually findable, said in words. `months` is 0-11 and
	 *  may wrap the new year, so this reads the run rather than sorting it. */
	const MONTHS = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];
	const fruitWhen = $derived.by(() => {
		const m = sp.fruit.months;
		if (!m?.length) return '';
		if (m.length >= 12) return 'All year';
		return m.length === 1 ? MONTHS[m[0]] : `${MONTHS[m[0]]} to ${MONTHS[m[m.length - 1]]}`;
	});

	let { data } = $props();
	const sp = $derived(data.species);

	const inGrove = $derived(grove.has(sp.id));

	async function add() {
		grove.addFind(sp.id);
		await goto(`${base}/grove/`);
	}

	/** Splits **bold** spans so reference notes can emphasise the key feature. */
	function parts(text: string) {
		return text.split(/(\*\*[^*]+\*\*)/).map((chunk) =>
			chunk.startsWith('**') && chunk.endsWith('**')
				? { bold: true, text: chunk.slice(2, -2) }
				: { bold: false, text: chunk }
		);
	}
</script>

<svelte:head>
	<title>{sp.name} ({sp.latin}) · Tree Hunt</title>
	<meta
		name="description"
		content="{sp.name} ({sp.latin}): how to spot it, its folklore and its science. {sp.tell}"
	/>
	<meta property="og:title" content="{sp.name} · Tree Hunt" />
	<meta property="og:description" content={sp.tell} />
</svelte:head>

<main class="view">
	<div class="row between">
		<a class="backlink" href="{base}/learn/">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M19 12H6" /><path d="M11.5 6.5L6 12l5.5 5.5" />
			</svg>
			All trees
		</a>
		<button class="pill" onclick={() => shareSpecies(sp)}>Share</button>
	</div>

	<div class="photos">
		<SpeciesPhoto id={sp.id} kind="tree" alt="A mature {sp.name}" height={210} priority />
		<SpeciesPhoto id={sp.id} kind="leaf" alt="Close-up of {sp.name} foliage" height={210} />
	</div>

	<div>
		<h1>{sp.name}</h1>
		<p class="sub latin">{sp.latin} · {sp.family}{inGrove ? ' · in My Trees' : ''}</p>
		{#if sp.aka?.length}
			<p class="sub">Also called {sp.aka.join(', ')}.</p>
		{/if}
	</div>

	<div class="row" style="flex-wrap:wrap">
		{#if inGrove}
			<span class="pill">✓ In My Trees</span>
			<button class="removebtn" onclick={() => grove.removeFind(sp.id)}>Remove from My Trees</button>
		{:else}
			<button class="btn" onclick={add}>Add to My Trees</button>
		{/if}
	</div>

	<dl class="quick">
		{#each sp.quick as [label, value] (label)}
			<div><dt>{label}</dt><dd>{value}</dd></div>
		{/each}
	</dl>

	<!-- Folklore leads. Most arrivals here are browsing for pleasure, not standing
	     under a branch, and the stories are what make someone care about the tree
	     before they can name it. The two reference sections follow, and anything
	     that sends you here to identify something links straight to #spotting. -->
	<nav class="contents" aria-label="On this page">
		<a href="#folklore">Folklore</a>
		<a href="#science">Science</a>
		<a href="#spotting">Spotting it</a>
		<a href="#bark">Bark</a>
		<a href="#fruit">Fruit</a>
		<a href="#year">Through the year</a>
	</nav>

	<section id="folklore" class="section">
		<h2 class="shead">Folklore</h2>
		<div class="prose">
			{#each sp.folklore as [title, body] (title)}
				<article class="story">
					<h3>{title}</h3>
					<p>{body}</p>
				</article>
			{/each}
		</div>
	</section>

	<section id="science" class="section">
		<h2 class="shead">Science</h2>
		<div class="prose">
			{#each sp.science as [title, body] (title)}
				<article class="entry">
					<h3>{title}</h3>
					<p>{body}</p>
				</article>
			{/each}
		</div>
	</section>

	<section id="spotting" class="section">
		<h2 class="shead">Spotting it</h2>
		<div class="prose">
			{#each sp.spot as note, i (i)}
				<p class="note">
					{#each parts(note) as part, j (j)}{#if part.bold}<strong>{part.text}</strong>{:else}{part.text}{/if}{/each}
				</p>
			{/each}
		</div>
	</section>

	<!-- Bark sits directly after the spotting notes because it is the same job
	     done in the half of the year when there are no leaves to look at. -->
	<section id="bark" class="section">
		<h2 class="shead">Bark</h2>
		<div class="barkrow">
			{#if hasBarkPhoto(sp.id)}
				<SpeciesPhoto id={sp.id} kind="bark" alt="The bark of a mature {sp.name}" height={190} />
			{/if}
			<div class="barktext">
				<p class="label">{barkLabel(sp.bark.texture)}</p>
				<p class="note">{sp.bark.note}</p>
				{#if sp.bark.young}
					<p class="young"><strong>When young:</strong> {sp.bark.young}</p>
				{/if}
				{#if !hasBarkPhoto(sp.id)}
					<!-- said plainly rather than shown as a broken frame: every bark photo
					     Commons offers for this one is a different species or a young trunk,
					     and a wrong photograph is worse than none -->
					<p class="nophoto">No bark photograph yet. We would rather show none than one of the wrong tree.</p>
				{/if}
				<a class="barklink" href="{base}/identify/#bark">Compare every {barkLabel(sp.bark.texture).toLowerCase()} bark →</a>
			</div>
		</div>
	</section>

	<!-- Fruit follows bark for the same reason bark follows the spotting notes: it
	     is the same question asked of whatever the tree is carrying today. Identify
	     has had a fruit key with photographs for a while, but the species page —
	     where you land when you want to be sure — carried the note and no picture,
	     so the one organ you can pick up and turn over was the one you could not
	     see. Reuses the bark section's layout, because it is the same shape of
	     thing: one photograph, a label, a note, a way to compare. -->
	<section id="fruit" class="section">
		<h2 class="shead">Fruit, nuts or cones</h2>
		<div class="barkrow">
			{#if hasOrganPhoto(sp.id, 'fruit')}
				<SpeciesPhoto id={sp.id} kind="fruit" alt="The fruit of a {sp.name}" height={190} />
			{/if}
			<div class="barktext">
				<p class="label">{fruitLabel(sp.fruit.kind)}{fruitWhen ? ` · ${fruitWhen}` : ''}</p>
				<p class="note">{sp.fruit.note}</p>
				{#if !hasOrganPhoto(sp.id, 'fruit')}
					<!-- Three species genuinely barely fruit in Britain. That is a fact about
					     the tree, not a gap in the library, so it is said rather than shown as
					     an empty frame. -->
					<p class="nophoto">
						No fruit photograph. This one barely fruits in Britain, so there is little to show.
					</p>
				{/if}
				<a class="barklink" href="{base}/identify/#fruit">
					Compare every tree carrying {fruitLabel(sp.fruit.kind).toLowerCase()} →
				</a>
			</div>
		</div>
	</section>

	<section id="year" class="section">
		<h2 class="shead">Through the year</h2>
		<div class="seasons">
			{#each sp.season as [season, note] (season)}
				<div class="seasoncard {season.toLowerCase()}">
					<p class="label">{season}</p>
					<p class="sn">{note}</p>
				</div>
			{/each}
		</div>
	</section>

	<p class="tell">One to tell: {sp.tell}</p>
</main>

<style>
	h1 {
		font-family: var(--display);
		font-weight: 400;
		font-size: var(--text-4xl);
		margin: 0;
		line-height: 1.15;
	}
	/* Caslon italic. `.sub` is a sans utility class, so inheriting it here handed
	   the binomial a synthetic slant on the one page devoted to that species. */
	.latin {
		font-family: var(--display);
		font-style: italic;
	}
	.backlink {
		font-size: var(--text-md);
		font-weight: 700;
		color: var(--deep);
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		text-decoration: none;
	}
	.backlink svg {
		width: 15px;
		height: 15px;
		flex: none;
	}
	.photos {
		display: grid;
		gap: 10px;
		grid-template-columns: 1fr;
	}
	.quick {
		margin: 0;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 14px;
		overflow: hidden;
	}
	.quick > div {
		display: grid;
		grid-template-columns: 96px 1fr;
		gap: 10px;
		padding: 9px 14px;
		border-bottom: 1px solid var(--line);
	}
	.quick > div:last-child {
		border-bottom: none;
	}
	.quick dt {
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--soft);
		padding-top: 2px;
	}
	.quick dd {
		margin: 0;
		font-size: var(--text-md);
	}
	.contents {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
	}
	.contents a {
		font-size: var(--text-sm);
		font-weight: 700;
		color: var(--deep);
		background: var(--wash);
		border: 1px solid var(--wash-line);
		border-radius: 999px;
		padding: 8px 13px;
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		text-decoration: none;
	}
	.section {
		scroll-margin-top: 12px;
	}
	.shead {
		font-family: var(--display);
		font-weight: 400;
		font-size: var(--text-2xl);
		margin: 6px 0 10px;
		padding-bottom: 7px;
		border-bottom: 1px solid var(--line);
	}
	.prose {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	/* spotting notes are instructions read standing under a tree: sans, larger,
	   full-contrast ink rather than soft grey */
	.note {
		font-size: var(--text-base);
		line-height: 1.6;
		color: var(--ink);
		border-left: 3px solid var(--wash-line);
		padding-left: 14px;
		max-width: 66ch;
	}
	.entry h3,
	.story h3 {
		font-family: var(--display);
		font-weight: 700;
		font-size: var(--text-lg);
		margin: 0 0 6px;
	}
	/* The two long-form blocks on the page, and the only place in the app where
	   someone reads 80+ words at a stretch. Hyphenated because the mobile measure
	   is ~44ch, where an unhyphenated rag on prose this dense gets visibly ragged. */
	.entry p {
		font-size: var(--text-base);
		line-height: 1.65;
		color: var(--ink);
		margin: 0;
		max-width: 66ch;
		hyphens: auto;
	}
	/* the folklore is the reason someone falls for a tree rather than merely
	   naming it, so it reads as prose, not as a caption */
	.story p {
		font-family: var(--display);
		font-size: var(--text-lg);
		line-height: 1.62;
		color: var(--ink);
		margin: 0;
		max-width: 60ch;
		hyphens: auto;
	}
	.barkrow {
		display: grid;
		gap: 12px;
		grid-template-columns: 1fr;
		align-items: start;
	}
	.barktext .note {
		border-left: none;
		padding-left: 0;
		margin: 4px 0 0;
	}
	.young {
		margin: 10px 0 0;
		font-size: var(--text-md);
		line-height: 1.55;
		color: var(--soft);
		max-width: 66ch;
	}
	.young strong {
		color: var(--ink);
	}
	.nophoto {
		margin: 10px 0 0;
		font-size: var(--text-md);
		line-height: 1.5;
		color: var(--soft);
		background: var(--stonewash);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 9px 12px;
	}
	.barklink {
		display: inline-flex;
		align-items: center;
		margin-top: 12px;
		min-height: 44px;
		font-size: var(--text-md);
		font-weight: 700;
		color: var(--deep);
	}
	.subhead {
		font-family: var(--display);
		font-weight: 400;
		font-size: var(--text-xl);
		margin: 8px 0 0;
	}
	.seasons {
		display: grid;
		gap: 9px;
		grid-template-columns: 1fr;
	}
	.seasoncard {
		background: var(--card);
		border: 1px solid var(--line);
		border-left: 4px solid var(--line);
		border-radius: 13px;
		padding: 11px 13px;
	}
	.seasoncard.spring {
		border-left-color: #8fbf5a;
	}
	.seasoncard.summer {
		border-left-color: var(--green);
	}
	.seasoncard.autumn {
		border-left-color: #c8862f;
	}
	.seasoncard.winter {
		border-left-color: #6b7f8a;
	}
	.sn {
		margin: 0;
		font-size: var(--text-md);
		line-height: 1.55;
		color: var(--ink);
	}
	.removebtn {
		font-size: var(--text-md);
		font-weight: 600;
		color: var(--soft);
		text-decoration: underline;
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		padding: 0 4px;
	}
	.removebtn:hover {
		color: var(--ink);
	}
	.tell {
		background: var(--stonewash);
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 13px 15px;
		font-family: var(--display);
		font-style: italic;
		font-size: var(--text-md);
		color: var(--forest);
		margin: 4px 0 0;
	}
	@media (min-width: 700px) {
		.photos,
		.seasons {
			grid-template-columns: 1fr 1fr;
		}
		.barkrow {
			grid-template-columns: 260px 1fr;
			gap: 18px;
		}
	}
	@media (min-width: 900px) {
		h1 {
			font-size: var(--text-6xl);
		}
		.quick > div {
			grid-template-columns: 120px 1fr;
		}
	}
</style>
