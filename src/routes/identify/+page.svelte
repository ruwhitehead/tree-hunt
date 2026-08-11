<script lang="ts">
	import { base } from '$app/paths';
	import LeafShape from '$lib/components/LeafShape.svelte';
	import BarkGlyph from '$lib/components/BarkGlyph.svelte';
	import { KEY1, KEY2, keyCandidates } from '$lib/content/key';
	import { BARK_KEY, barkCandidates, barkLabel, hasBarkPhoto } from '$lib/content/bark';
	import {
		FLOWER_KEY,
		FLOWERING_COUNT,
		FRUIT_KEY,
		flowerCandidates,
		flowerLabel,
		fruitCandidates,
		fruitLabel,
		hasOrganPhoto,
		keyAvailability,
		keyOrder,
		type KeyId
	} from '$lib/content/organs';
	import type { BarkTexture, FlowerKind, FruitKind, Species } from '$lib/content/types';
	import { SPECIES, speciesById } from '$lib/content/species';
	import { PLACES, placeSpecies } from '$lib/content/habitats';
	import type { LeafKind } from '$lib/content/types';
	import { detectPlatform } from '$lib/platform';

	let step1: LeafKind | null = $state(null);
	let step2: string | null = $state(null);

	let barkPick = $state<BarkTexture | null>(null);
	let fruitPick = $state<FruitKind | null>(null);
	let flowerPick = $state<FlowerKind | null>(null);
	const barkList = $derived(barkPick ? barkCandidates(barkPick) : []);
	const fruitList = $derived(fruitPick ? fruitCandidates(fruitPick) : []);
	const flowerList = $derived(flowerPick ? flowerCandidates(flowerPick) : []);

	const candidates = $derived(step1 && step2 ? keyCandidates(step1, step2) : []);
	const step2Options: { id: string; title: string }[] = $derived(step1 ? KEY2[step1] : []);

	/** Only the instructions that are true of the thing in your hand. */
	const platform = detectPlatform();

	/** Which key can name the most trees today. Read once, at load: the page does
	 *  not need to reshuffle itself if someone leaves it open past midnight. */
	const now = new Date();
	const MONTH = now.toLocaleDateString('en-GB', { month: 'long' });
	const keys = keyOrder(now.getMonth());
	const availability = keyAvailability(now.getMonth());
	const reachOf = (k: KeyId) => {
		const n = availability.find((a) => a.id === k)?.reach ?? 0;
		return k === 'place' ? '' : `${n} of ${SPECIES.length}`;
	};

	const SUMMARY: Record<KeyId, string> = {
		leaf: 'Or answer three questions about the leaf',
		bark: 'Or start from the bark',
		fruit: 'Or from the fruit, nuts or cones',
		flower: 'Or from the flowers',
		place: 'Or narrow it down by where you are standing'
	};

	/** Not every species has every organ photographed, and some genuinely have
	 *  nothing to photograph — a Lombardy poplar in Britain is a male clone and
	 *  never fruits. Either way the card says so rather than showing a gap. */
	const hasPhoto = (id: string, organ: string) =>
		organ === 'bark' ? hasBarkPhoto(id) : hasOrganPhoto(id, organ as 'fruit' | 'flower');
</script>

<svelte:head>
	<title>Identify a tree · Tree Hunt</title>
</svelte:head>

{#snippet backTo(label: string, reset: () => void)}
	<button class="backlink" onclick={reset}>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M19 12H6" /><path d="M11.5 6.5L6 12l5.5 5.5" />
		</svg>
		{label}
	</button>
{/snippet}

<!-- A grid of photographs to match against. Used by bark, fruit and flower: all
     three ask one question and then let the eye do the rest, because the second
     question a key would have to ask - is that fissure deep, is that berry a
     drupe - is one nobody standing under the tree can answer. -->
{#snippet photoGrid(list: Species[], organ: 'bark' | 'fruit' | 'flower')}
	<ul class="pgrid">
		{#each list as sp (sp.id)}
			<li>
				<a class="pcard" href="{base}/species/{sp.id}/#{organ}">
					{#if hasPhoto(sp.id, organ)}
						<img src="{base}/images/species/{sp.id}-{organ}-480.webp" alt="The {organ} of a {sp.name}" width="400" height="400" loading="lazy" decoding="async" />
					{:else}
						<span class="nopic">No photo yet</span>
					{/if}
					<span class="bn">{sp.name}</span>
				</a>
			</li>
		{/each}
	</ul>
{/snippet}

{#snippet keyBody(k: KeyId)}
	{#if k === 'leaf'}
		{#if !step1}
			<p class="label">Step 1 of 3 · What kind of leaf is it?</p>
			{#each KEY1 as o (o.id)}
				<button class="opt" onclick={() => (step1 = o.id)}>
					<span class="glyph"><LeafShape shape={o.id} size={44} /></span>
					<span><span class="ot">{o.title}</span><br /><span class="ob">{o.desc}</span></span>
				</button>
			{/each}
		{:else if !step2}
			{@render backTo('Start again', () => (step1 = null))}
			<p class="label">Step 2 of 3 · Look a little closer</p>
			{#each step2Options as o (o.id)}
				<button class="opt" onclick={() => (step2 = o.id)}>
					<span class="glyph"><LeafShape shape={o.id} size={44} /></span>
					<span class="ot">{o.title}</span>
				</button>
			{/each}
		{:else}
			{@render backTo('Back', () => (step2 = null))}
			<p class="label">
				Step 3 of 3 · {candidates.length}
				{candidates.length === 1 ? 'candidate' : 'candidates'} — compare with your leaf
			</p>
			{#each candidates as sp (sp.id)}
				<a class="opt" href="{base}/species/{sp.id}/#spotting">
					<span class="thumb">
						<img src="{base}/images/species/{sp.id}-leaf.webp" alt="" width="120" height="120" loading="lazy" decoding="async" />
					</span>
					<span>
						<span class="ot">{sp.name}</span>
						<span class="ob" style="font-style:italic">{sp.latin}</span><br />
						<span class="ob">{sp.hint}</span>
					</span>
				</a>
			{/each}
			{#if candidates.length === 0}
				<p class="sub">Nothing in the guide matches that combination — try stepping back.</p>
			{/if}
		{/if}
	{:else if k === 'bark'}
		{#if !barkPick}
			<p class="label">Put a hand on the trunk at chest height. Which is it?</p>
			{#each BARK_KEY as o (o.id)}
				<button class="opt" onclick={() => (barkPick = o.id)}>
					<span class="glyph" aria-hidden="true"><BarkGlyph texture={o.id} size={44} /></span>
					<span><span class="ot">{o.title}</span><br /><span class="ob">{o.desc}</span></span>
				</button>
			{/each}
		{:else}
			{@render backTo('All six barks', () => (barkPick = null))}
			<p class="label">{barkLabel(barkPick)} · {barkList.length} trees — find yours by eye</p>
			{@render photoGrid(barkList, 'bark')}
			<p class="sub">
				Bark changes with age, and these are all mature trunks. A young tree of the same species can be
				smooth when its parent is deeply ridged, so check something else before you settle.
			</p>
		{/if}
	{:else if k === 'fruit'}
		{#if !fruitPick}
			<p class="label">What is it carrying? Look up, and on the ground underneath.</p>
			{#each FRUIT_KEY as o (o.id)}
				<button class="opt" onclick={() => (fruitPick = o.id)}>
					<span><span class="ot">{o.title}</span><br /><span class="ob">{o.desc}</span></span>
				</button>
			{/each}
		{:else}
			{@render backTo('All six kinds', () => (fruitPick = null))}
			<p class="label">{fruitLabel(fruitPick)} · {fruitList.length} trees</p>
			{@render photoGrid(fruitList, 'fruit')}
			<p class="sub">
				Fallen fruit under a tree is not proof it came from that tree, especially in a hedge or a
				street. Check it against the leaves or the bark before you settle.
			</p>
		{/if}
	{:else if k === 'flower'}
		{#if !flowerPick}
			<p class="label">What do the flowers look like?</p>
			{#each FLOWER_KEY as o (o.id)}
				<button class="opt" onclick={() => (flowerPick = o.id)}>
					<span><span class="ot">{o.title}</span><br /><span class="ob">{o.desc}</span></span>
				</button>
			{/each}
			<p class="sub">
				Only {FLOWERING_COUNT} of the {SPECIES.length} flower at all. The conifers never do — if yours
				is a needled tree, its cones are what you want, not this.
			</p>
		{:else}
			{@render backTo('All five kinds', () => (flowerPick = null))}
			<p class="label">{flowerLabel(flowerPick)} · {flowerList.length} trees</p>
			{@render photoGrid(flowerList, 'flower')}
		{/if}
	{:else}
		<p class="sub" style="margin-top:8px">
			Trees are not scattered at random. The place you're standing in usually cuts the candidates to
			three or four before you look at anything.
		</p>
		{#each PLACES as p (p.place)}
			<section class="place">
				<h2>{p.place}</h2>
				<p class="blurb">{p.blurb}</p>
				<ul class="chips">
					{#each placeSpecies(p.ids) as sp (sp.id)}
						<li>
							<a class="chip" href="{base}/species/{sp.id}/#spotting">
								<img src="{base}/images/species/{sp.id}-thumb.webp" alt="" width="80" height="80" loading="lazy" decoding="async" />
								<span>{sp.name}</span>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	{/if}
{/snippet}

<main class="view">
	<div class="vhead"><h1>Identify a tree</h1></div>

	<div class="card stonebg">
		<p class="how">
			<strong>{keys.length} ways in, ordered for {MONTH}.</strong> Fruit and flowers are only on the tree
			for part of the year, and half the guide is bare all winter, so the one that can name the most trees
			today comes first. None of them needs a photograph, a signal or a server.
		</p>
	</div>

	{#each keys as k, i (k)}
		{@const lead = i === 0}
		{#if lead}
			<section class="keyblock" id={k}>{@render keyBody(k)}</section>
		{:else}
			<details class="keyblock alt" id={k}>
				<summary>{SUMMARY[k]}<span class="reach">{reachOf(k)}</span></summary>
				{@render keyBody(k)}
			</details>
		{/if}
	{/each}

	<!-- Last, and deliberately last: this sends someone out of the app. It sits
	     below all three keys, closed, styled like the habitat block rather than
	     like one of our own answers.

	     Visual Look Up and Google Lens are OS features with no web API, so this
	     is a signpost and never a button - the app cannot drive either of them.
	     Only the instructions true of the device in hand are rendered; there is
	     no point showing an iPhone owner where Chrome keeps its right-click
	     menu. -->
	<details class="lastresort">
		<summary>Still no idea? Ask your phone</summary>
		<p class="sub" style="margin-top:8px">
			Take a photo with your normal camera, then hand it to the recogniser already built into your
			{platform === 'desktop' ? 'browser' : 'phone'}. It searches a far larger range of plants than
			this guide's {SPECIES.length} trees.
		</p>

		{#if platform === 'ios'}
			<ol class="steps">
				<li>Photograph the leaf, or the bark, against a plain background.</li>
				<li>Open the picture in <strong>Photos</strong>.</li>
				<li>
					Tap the <strong>info button</strong> (ⓘ) below it, or swipe up. If Apple has recognised a
					plant, the button carries a small leaf symbol.
				</li>
				<li>Tap <strong>Look Up – Plant</strong>.</li>
			</ol>
			<p class="caveat">
				This is Apple's Visual Look Up. It needs iOS 15 or later and is not offered in every country
				or language, so the leaf symbol simply will not appear on some phones.
			</p>
		{:else if platform === 'android'}
			<ol class="steps">
				<li>Photograph the leaf, or the bark, against a plain background.</li>
				<li>
					Open it in <strong>Google Photos</strong> and tap the <strong>Lens</strong> button, or open
					the Google app and tap the camera icon.
				</li>
				<li>Lens names its best guess and shows you what it matched against.</li>
			</ol>
			<p class="caveat">
				Some camera apps have a Lens or Google Lens mode built straight in, which saves a step.
			</p>
		{:else}
			<ol class="steps">
				<li>Get the photo onto this computer.</li>
				<li>
					In Chrome or Edge, right-click it and choose <strong>Search image with Google</strong>.
				</li>
				<li>
					In Safari or Firefox there is no equivalent, so go to
					<a href="https://images.google.com" target="_blank" rel="noopener">images.google.com</a>
					and use the camera icon in the search box to upload it.
				</li>
			</ol>
		{/if}

		<p class="caveat">
			<strong>Then come back and check it.</strong> These tools are confident even when they are
			wrong, and they are worst at exactly the pairs this guide cares about — sessile against English
			oak, blackthorn against hawthorn. They will also happily name a garden cultivar that grows in no
			British wood. Read the spotting notes and the bark before you believe an answer.
		</p>
	</details>
</main>

<style>
	.how {
		margin: 0;
		font-size: 13.5px;
		line-height: 1.55;
		color: var(--soft);
	}
	.pgrid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 9px;
	}
	.pcard {
		display: flex;
		flex-direction: column;
		gap: 5px;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 13px;
		padding: 7px 7px 9px;
		text-decoration: none;
		color: inherit;
		text-align: center;
	}
	.pcard:hover {
		border-color: var(--green);
	}
	.pcard img,
	.pcard .nopic {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		border-radius: 9px;
		display: block;
		background: var(--stonewash);
	}
	.pcard .nopic {
		display: grid;
		place-items: center;
		font-size: 10.5px;
		font-weight: 700;
		color: var(--soft);
		padding: 4px;
	}
	.bn {
		font-size: 11.5px;
		font-weight: 700;
		line-height: 1.25;
	}
	.steps {
		margin: 10px 0 0;
		padding-left: 20px;
		display: grid;
		gap: 7px;
		font-size: 14px;
		line-height: 1.55;
		color: var(--ink);
		max-width: 62ch;
	}
	.steps a {
		color: var(--deep);
		font-weight: 600;
	}
	.caveat {
		margin: 12px 0 0;
		font-size: 13px;
		line-height: 1.55;
		color: var(--soft);
		max-width: 62ch;
	}
	.caveat strong {
		color: var(--ink);
	}
	/* every key below the leading one, and the hand-off at the foot of the page,
	   share one collapsed treatment: the page offers five routes and only the one
	   that can name the most trees today is open */
	.keyblock.alt,
	.lastresort {
		margin-top: 10px;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 15px;
		padding: 12px 15px;
	}
	.keyblock {
		scroll-margin-top: 12px;
		display: flex;
		flex-direction: column;
		gap: 9px;
	}
	.keyblock.alt summary {
		font-weight: 700;
		font-size: 14px;
		color: var(--deep);
		cursor: pointer;
		min-height: 44px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}
	/* how many of the fifty this key can reach today — the reason for the order */
	.reach {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--soft);
		font-variant-numeric: tabular-nums;
		flex: none;
	}
	.place {
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid var(--line);
	}
	.place h2 {
		font-family: var(--display);
		font-weight: 400;
		font-size: 17px;
		margin: 0 0 4px;
	}
	.blurb {
		margin: 0 0 10px;
		font-size: 13px;
		line-height: 1.55;
		color: var(--soft);
		max-width: 62ch;
	}
	.chips {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: var(--wash);
		border: 1px solid var(--wash-line);
		border-radius: 999px;
		padding: 5px 13px 5px 5px;
		text-decoration: none;
		color: var(--deep);
		font-weight: 700;
		font-size: 12.5px;
		min-height: 44px;
	}
	.chip img {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		object-fit: cover;
		display: block;
	}
	.opt {
		display: flex;
		align-items: center;
		gap: 13px;
		width: 100%;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 14px;
		padding: 13px 14px;
		min-height: 66px;
		text-decoration: none;
		color: inherit;
		transition: transform 0.12s ease, border-color 0.12s ease;
	}
	.opt:hover {
		border-color: var(--green);
	}
	.opt:active {
		transform: scale(0.98);
	}
	.glyph {
		width: 46px;
		flex: none;
		display: grid;
		place-items: center;
	}
	.thumb {
		width: 54px;
		height: 54px;
		flex: none;
		border-radius: 10px;
		overflow: hidden;
		background: var(--stonewash);
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.ot {
		font-weight: 700;
		font-size: 14.5px;
	}
	.ob {
		font-size: 12.5px;
		color: var(--soft);
	}
	.backlink {
		font-size: 13.5px;
		font-weight: 700;
		color: var(--deep);
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	.backlink svg {
		width: 15px;
		height: 15px;
		flex: none;
	}
	@media (min-width: 700px) {
		.pgrid {
			grid-template-columns: repeat(4, 1fr);
		}
	}
	@media (min-width: 900px) {
		.opt {
			max-width: 620px;
		}
		.pgrid {
			grid-template-columns: repeat(6, 1fr);
			max-width: 760px;
		}
	}
</style>
