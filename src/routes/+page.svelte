<script lang="ts">
	import { base } from '$app/paths';
	import Give from '$lib/components/Give.svelte';
	import TreeMark from '$lib/components/TreeMark.svelte';
	import { factForDate, SEASONS } from '$lib/content/facts';
	import { SPECIES } from '$lib/content/species';
	import { grove } from '$lib/grove.svelte';
	import { missionsFor, windowLabel } from '$lib/content/missions';
	import { progressFor } from '$lib/missions.svelte';

	const now = new Date();
	const dateLine = `${now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · ${SEASONS[now.getMonth()]}`;
	const greeting =
		now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
	const fact = factForDate(now);

	/** Tree of the day — stable for the whole day, and never one you've met. */
	const dayIndex = Math.floor(now.getTime() / 86400000);
	const featured = $derived(
		(() => {
			const unmet = SPECIES.filter((s) => !grove.has(s.id));
			const pool = unmet.length ? unmet : SPECIES;
			return pool[dayIndex % pool.length];
		})()
	);

	/** Hunts running today, least finished first, so the card leads with the one
	 *  there is most still to do on. */
	const hunts = $derived(
		missionsFor(now)
			.current.map((m) => progressFor(m, now))
			.sort((a, b) => a.fraction - b.fraction)
	);

</script>

<svelte:head>
	<title>Meet a Tree — the trees near you, by name</title>
	<meta
		name="description"
		content="A free pocket field guide to {SPECIES.length} British and Irish trees — how to spot them, their folklore and their science. In support of the International Tree Foundation."
	/>
</svelte:head>

<main class="view">
	<div class="vhead">
		<div>
			<p class="vsub">{dateLine}</p>
			<h1>{greeting}</h1>
		</div>
	</div>

	<div class="card tint">
		<p class="label">Today's tree fact</p>
		<p class="serif">{fact}</p>
	</div>

	<a class="card featured" href="{base}/species/{featured.id}/">
		<span class="fpic">
			<img
				src="{base}/images/species/{featured.id}-tree.webp"
				srcset="{base}/images/species/{featured.id}-tree-480.webp 480w, {base}/images/species/{featured.id}-tree.webp 900w"
				sizes="(min-width: 700px) 420px, 100vw"
				alt="A {featured.name}"
				width="900"
				height="675"
				loading="eager"
				fetchpriority="high"
				decoding="async"
			/>
		</span>
		<span class="fbody">
			<span class="label">Meet this tree</span>
			<span class="fname">{featured.name}</span>
			<span class="flatin">{featured.latin}</span>
			<span class="fhint">{featured.hint}</span>
			<span class="ftell">{featured.tell}</span>
		</span>
	</a>

	<!-- Seasons used to be its own tab. It is the same question as Today - what is
	     worth doing now - and Today had just lost the "your trees this week" block
	     to a thin fact-and-a-photo, so the hunts moved up here. The full board
	     still lives at /missions, off the tab bar, the way /learn's depth does. -->
	{#if hunts.length}
		{@const h = hunts[0]}
		<a class="card tint linkcard" href="{base}/missions/">
			<p class="label">On now · {windowLabel(h.mission)}</p>
			<p class="serif small">{h.mission.title} — {h.mission.blurb}</p>
			<p class="huntbar">
				<span class="hn">{h.done.length} of {h.mission.target}</span>
				found, looking for {h.mission.looking}{hunts.length > 1
					? `. ${hunts.length - 1} other hunt${hunts.length > 2 ? 's' : ''} running too.`
					: '.'} →
			</p>
		</a>
	{:else}
		<a class="card linkcard" href="{base}/missions/">
			<p class="label">Seasonal hunts</p>
			<p class="serif small">
				Time-boxed hunts that give the calendar teeth — blossom in spring, conkers in autumn. Nothing
				is running today, but the next one is listed. →
			</p>
		</a>
	{/if}

	<Give />

	<a
		class="itf"
		href="https://internationaltreefoundation.org"
		target="_blank"
		rel="noopener"
	>
		<img
			src="{base}/images/itf-logo.png"
			alt="International Tree Foundation"
			width="168"
			height="88"
			loading="lazy"
		/>
		<span class="itftext">
			<strong>Meet a Tree is made in support of the International Tree Foundation</strong>
			Registered charity no. 1106269. Free forever · no ads · your trees stay on your phone. Tap the
			logo to visit them ↗
		</span>
	</a>
</main>

<style>
	.itf {
		display: flex;
		align-items: center;
		gap: 14px;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 14px 15px;
		text-decoration: none;
		color: inherit;
		transition: border-color 0.12s ease;
	}
	.itf:hover {
		border-color: var(--green);
	}
	.itf img {
		width: 96px;
		height: auto;
		flex: none;
	}
	/* their mark is dark green artwork on transparency, so it needs a light
	   ground to stay legible in dark mode */
	@media (prefers-color-scheme: dark) {
		.itf img {
			background: #fbfaf7;
			border-radius: 8px;
			padding: 6px 8px;
		}
	}
	.itftext {
		font-size: 11.5px;
		line-height: 1.45;
		color: var(--soft);
	}
	.itftext strong {
		display: block;
		color: var(--ink);
		font-size: 12.5px;
		margin-bottom: 2px;
	}
	.vhead h1 {
		font-size: 27px;
		line-height: 1.15;
		text-wrap: balance;
	}
	.linkcard {
		text-decoration: none;
		color: inherit;
		display: block;
		transition: border-color 0.12s ease;
	}
	.linkcard:hover {
		border-color: var(--green);
	}
	.serif.small {
		font-size: 15px;
	}
	.featured {
		display: flex;
		flex-direction: column;
		gap: 0;
		padding: 0;
		overflow: hidden;
		text-decoration: none;
		color: inherit;
		transition: border-color 0.12s ease;
	}
	.featured:hover {
		border-color: var(--green);
	}
	.fpic {
		display: block;
		aspect-ratio: 16 / 9;
		background: var(--stonewash);
	}
	.fpic img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.fbody {
		display: block;
		padding: 12px 15px 14px;
	}
	.fname {
		display: block;
		font-family: var(--display);
		font-size: 20px;
		line-height: 1.2;
	}
	.flatin {
		display: block;
		font-size: 12.5px;
		font-style: italic;
		color: var(--soft);
	}
	.fhint {
		display: block;
		font-size: 13px;
		color: var(--soft);
		margin-top: 6px;
	}
	.ftell {
		display: block;
		font-family: var(--display);
		font-style: italic;
		font-size: 13.5px;
		color: var(--forest);
		margin-top: 8px;
	}
	.huntbar {
		margin: 8px 0 0;
		font-size: 13px;
		line-height: 1.5;
		color: var(--soft);
	}
	.hn {
		font-weight: 700;
		color: var(--deep);
		font-variant-numeric: tabular-nums;
	}
	@media (min-width: 900px) {
		.featured {
			flex-direction: row;
			align-items: stretch;
		}
		.fpic {
			width: 300px;
			flex: none;
			aspect-ratio: auto;
		}
	}
</style>
