<script lang="ts">
	import { base } from '$app/paths';
	import Give from '$lib/components/Give.svelte';
	import TreeMark from '$lib/components/TreeMark.svelte';
	import { factForDate, SEASONS } from '$lib/content/facts';
	import { SPECIES } from '$lib/content/species';
	import GroveStrip from '$lib/components/GroveStrip.svelte';
	import { grove } from '$lib/grove.svelte';
	import { missionsFor, windowLabel } from '$lib/content/missions';
	import { progressFor } from '$lib/missions.svelte';
	import { seasonOfMonth } from '$lib/season';

	const now = new Date();
	/** The season spine, on the two things here that genuinely carry a season:
	 *  the greeting, whose date line names it in words, and a hunt, whose window
	 *  is a season. Deliberately not the fact card — the daily fact is not about
	 *  the time of year, and a colour that says "summer" over a fact about
	 *  hornbeam timber would be decoration wearing information's clothes. */
	const season = seasonOfMonth(now.getMonth());
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
	<title>Tree Hunt — the trees near you, by name</title>
	<meta
		name="description"
		content="A free pocket field guide to {SPECIES.length} British and Irish trees — how to spot them, their folklore and their science. In support of the International Tree Foundation."
	/>
</svelte:head>

<main class="view">
	<!-- The greeting used to be bare text on paper, on the one page whose whole
	     subject is the time of year. It now sits on a ground tinted by the
	     season it is already naming in words, with the app's mark for an
	     anchor. -->
	<div class="vhead hero {season}">
		<div>
			<p class="vsub">{dateLine}</p>
			<h1>{greeting}</h1>
		</div>
		<span class="mark" aria-hidden="true"><TreeMark size={44} /></span>
	</div>

	<!-- The photograph leads. This card is the only beautiful thing on Today and
	     it used to sit below a text card, so the first screenful of a guide to
	     fifty photographed trees was prose. -->
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

	<GroveStrip />

	<div class="card tint">
		<p class="label">Today's tree fact</p>
		<p class="serif">{fact}</p>
	</div>

	<!-- Seasons used to be its own tab. It is the same question as Today - what is
	     worth doing now - and Today had just lost the "your trees this week" block
	     to a thin fact-and-a-photo, so the hunts moved up here. The full board
	     still lives at /missions, off the tab bar, the way /learn's depth does. -->
	{#if hunts.length}
		{@const h = hunts[0]}
		<a class="card tint linkcard spine {seasonOfMonth(h.mission.from[0])}" href="{base}/missions/">
			<p class="label">On now · {windowLabel(h.mission)}</p>
			<p class="serif small">{h.mission.title} — {h.mission.blurb}</p>
			<!-- the count was a sentence doing a graphic's job. The segments are
			     aria-hidden because the line under them says the same thing, which
			     is also what keeps this off the wrong side of "never information
			     by colour alone". -->
			<span class="segs" aria-hidden="true">
				{#each Array.from({ length: h.mission.target }) as _, i (i)}
					<span class="seg" class:on={i < h.done.length}></span>
				{/each}
			</span>
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
			<strong>Tree Hunt is made in support of the International Tree Foundation</strong>
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

	/* ---- the season, as a colour ----
	   One set of four values, the same ones the timeline, the species calendar
	   and the mission board use, so a given green always means the same thing.
	   They are set as a custom property here rather than as four border rules,
	   because the hero ground and the hunt segments want the same colour and
	   neither is a border. */
	/* The alphas are not eyeballed. The date line above the greeting is 13px
	   `--soft`, which is the tightest pair on the page, and the tint sits under
	   it at full strength — the gradient starts in that corner. Each one is the
	   strongest tint that still clears AA on `--soft` in BOTH themes, which is a
	   real constraint in two directions: spring and autumn are pale enough to
	   wash out the light theme, and lifting the dark card too far does the same
	   to the dark one. As first written, spring failed at 4.42 in dark mode and
	   winter at 4.43 in light. These clear 4.77 or better everywhere. */
	.spring {
		--season: #8fbf5a;
		--season-ground: rgba(143, 191, 90, 0.2);
	}
	.summer {
		--season: var(--green);
		--season-ground: rgba(22, 126, 60, 0.14);
	}
	.autumn {
		--season: #c8862f;
		--season-ground: rgba(200, 134, 47, 0.2);
	}
	.winter {
		--season: #6b7f8a;
		--season-ground: rgba(107, 127, 138, 0.18);
	}

	.hero {
		align-items: center;
		padding: 16px 18px 18px;
		border-radius: 18px;
		background-color: var(--card);
		/* a translucent tint rather than four opaque colours: it lands the same
		   way over paper and over the dark card, and it is faint enough that the
		   heading contrast is unchanged in both themes */
		background-image: linear-gradient(150deg, var(--season-ground), transparent 70%);
	}
	.hero .mark {
		color: var(--deep);
		opacity: 0.55;
		flex: none;
	}

	.spine {
		border-left: 4px solid var(--season, var(--line));
	}
	.segs {
		display: flex;
		gap: 4px;
		margin-top: 10px;
	}
	.seg {
		height: 6px;
		flex: 1;
		border-radius: 999px;
		border: 1px solid var(--wash-line);
	}
	.seg.on {
		background: var(--season, var(--green));
		border-color: var(--season, var(--green));
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
