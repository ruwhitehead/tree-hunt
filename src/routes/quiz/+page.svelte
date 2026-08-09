<script lang="ts">
	import { base } from '$app/paths';
	import { SPECIES, speciesById } from '$lib/content/species';
	import { grove } from '$lib/grove.svelte';
	import { buildRound, seedFrom, type QuizMode, type QuizScope, type Round } from '$lib/quiz';
	import { dateStr } from '$lib/streak';

	const MODES: { id: QuizMode; title: string; desc: string }[] = [
		{ id: 'name', title: 'Name the tree', desc: 'Photographs, bark and one-line descriptions' },
		{ id: 'folklore', title: 'Folklore', desc: 'The stories, and what they were told about' },
		{ id: 'science', title: 'Science', desc: 'How they work, and what they are doing now' },
		{ id: 'mixed', title: 'A bit of everything', desc: 'All four, shuffled' }
	];

	let mode = $state<QuizMode>('name');
	let scope = $state<QuizScope>('guide');
	let round = $state<Round | null>(null);
	/** answers so far, by question index */
	let picks = $state<(string | null)[]>([]);
	let at = $state(0);
	/** counts up so a second go at the same mode is a different round */
	let attempt = $state(0);

	const found = $derived([...grove.speciesIds]);
	const enoughFound = $derived(found.length >= 8);
	const q = $derived(round?.questions[at]);
	const picked = $derived(picks[at] ?? null);
	const done = $derived(Boolean(round) && at >= (round?.questions.length ?? 0));
	const right = $derived(
		round ? round.questions.filter((qq, i) => picks[i] === qq.answer).length : 0
	);
	const missed = $derived(
		round ? round.questions.filter((qq, i) => picks[i] !== qq.answer) : []
	);

	function start(only?: string[]) {
		// the date seeds it, so a round is reproducible; the attempt counter means
		// "try those two again" is genuinely a new round rather than the same one
		const seed = seedFrom(`${dateStr(new Date())}|${mode}|${scope}|${attempt}|${only?.join(',') ?? ''}`);
		attempt += 1;
		round = buildRound({
			mode,
			scope: only ? 'guide' : scope,
			found: only ?? found,
			seed,
			length: only ? Math.min(only.length, 8) : 8
		});
		if (only) {
			// keep only the ones asked for again, in case the generator reached wider
			const wanted = new Set(only);
			const kept = round.questions.filter((x) => wanted.has(x.answer));
			if (kept.length) round = { ...round, questions: kept };
		}
		picks = [];
		at = 0;
	}

	function answer(id: string) {
		if (picks[at]) return;
		const next = [...picks];
		next[at] = id;
		picks = next;
	}
</script>

<svelte:head>
	<title>Quiz · Meet a Tree</title>
	<meta
		name="description"
		content="Test yourself on {SPECIES.length} British and Irish trees — name them from photographs and bark, or on their folklore and science."
	/>
</svelte:head>

<main class="view">
	<div class="vhead"><h1>Quiz</h1></div>

	{#if !round}
		<div class="card stonebg">
			<p class="how">
				Eight questions, drawn from the guide itself. No timer, no score kept, nothing to keep up —
				get one wrong and it tells you what would have given it away.
			</p>
		</div>

		<p class="label">What shall we ask about?</p>
		{#each MODES as m (m.id)}
			<button class="opt" class:on={mode === m.id} onclick={() => (mode = m.id)} aria-pressed={mode === m.id}>
				<span><span class="ot">{m.title}</span><br /><span class="ob">{m.desc}</span></span>
				{#if mode === m.id}<span class="check" aria-hidden="true">✓</span>{/if}
			</button>
		{/each}

		<p class="label" style="margin-top:6px">Which trees?</p>
		<div class="scopes">
			<button class="scope" class:on={scope === 'guide'} onclick={() => (scope = 'guide')} aria-pressed={scope === 'guide'}>
				All {SPECIES.length}
			</button>
			<button
				class="scope"
				class:on={scope === 'grove'}
				onclick={() => (scope = 'grove')}
				aria-pressed={scope === 'grove'}
				disabled={!enoughFound}
			>
				Just my grove · {found.length}
			</button>
		</div>
		{#if !enoughFound}
			<p class="sub" style="margin-top:0">
				Revising only what you have found needs at least eight in your grove — you have {found.length}.
			</p>
		{/if}

		<button class="btn" onclick={() => start()}>Start</button>
	{:else if done}
		<div class="card tint">
			<p class="label">Round finished</p>
			<p class="score"><strong>{right}</strong> of {round.questions.length}</p>
			<p class="sub" style="margin:4px 0 0">
				{right === round.questions.length
					? 'All of them. Nothing here to correct.'
					: `Here ${missed.length === 1 ? 'is the one' : `are the ${missed.length}`} that got away.`}
			</p>
		</div>

		{#each missed as m (m.answer)}
			{@const sp = speciesById(m.answer)}
			{#if sp}
				<a class="missed" href="{base}/species/{sp.id}/{m.where}">
					<img src="{base}/images/species/{sp.id}-thumb.webp" alt="" width="120" height="120" loading="lazy" />
					<span class="mt">
						<span class="mn">{sp.name}</span>
						<span class="mb">{m.because}</span>
					</span>
					<span class="chev" aria-hidden="true">›</span>
				</a>
			{/if}
		{/each}

		<div class="row">
			{#if missed.length}
				<button class="btn" onclick={() => start(missed.map((m) => m.answer))}>
					Try those {missed.length === 1 ? 'again' : `${missed.length} again`}
				</button>
			{/if}
			<button class="btn ghost" onclick={() => start()}>Another round</button>
			<button class="btn ghost" onclick={() => (round = null)}>Change subject</button>
		</div>
	{:else if q}
		<p class="progress">Question {at + 1} of {round.questions.length}</p>
		{#if round.widened}
			<p class="sub" style="margin-top:0">
				Not enough in your grove yet, so this round is drawn from the whole guide.
			</p>
		{/if}

		<div class="card qcard">
			<p class="ask">{q.ask}</p>
			{#if q.image}
				<img
					class="qpic"
					class:bark={q.image.kind === 'bark'}
					src="{base}/images/species/{q.image.id}-{q.image.kind}{q.image.kind === 'bark' ? '-480' : '-480'}.webp"
					alt="An unnamed tree, for you to identify"
					width="480"
					height="480"
					loading="eager"
				/>
			{/if}
			{#if q.passage}
				<p class="passage">{q.passage}</p>
			{/if}
		</div>

		<div class="answers">
			{#each q.options as id (id)}
				{@const sp = speciesById(id)}
				{@const isAnswer = id === q.answer}
				<button
					class="ans"
					class:correct={picked && isAnswer}
					class:wrong={picked === id && !isAnswer}
					onclick={() => answer(id)}
					disabled={Boolean(picked)}
				>
					<span>{sp?.name ?? id}</span>
					{#if picked && isAnswer}
						<span class="mark" aria-label="correct">✓</span>
					{:else if picked === id}
						<span class="mark" aria-label="not this one">✕</span>
					{/if}
				</button>
			{/each}
		</div>

		{#if picked}
			{@const sp = speciesById(q.answer)}
			<!-- The teaching moment. Marking an answer red and moving on teaches
			     nothing; the line that would have given it away is the whole point
			     of getting one wrong. -->
			<div class="card tint" aria-live="polite">
				<p class="label">{picked === q.answer ? 'Yes' : `It was the ${sp?.name.toLowerCase()}`}</p>
				<p class="serif" style="font-size:15px">{q.because}</p>
				<a class="more" href="{base}/species/{q.answer}/{q.where}">Read more about the {sp?.name.toLowerCase()} →</a>
			</div>
			<button class="btn" onclick={() => (at += 1)}>
				{at + 1 === round.questions.length ? 'See how you did' : 'Next question'}
			</button>
		{/if}
	{/if}
</main>

<style>
	.how {
		margin: 0;
		font-size: 13.5px;
		line-height: 1.55;
		color: var(--soft);
	}
	.opt {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 13px;
		width: 100%;
		background: var(--card);
		border: 1.5px solid var(--line);
		border-radius: 14px;
		padding: 13px 14px;
		min-height: 62px;
		text-align: left;
		color: inherit;
	}
	.opt.on {
		border-color: var(--green);
		background: var(--wash);
	}
	.ot {
		font-weight: 700;
		font-size: 14.5px;
	}
	.ob {
		font-size: 12.5px;
		color: var(--soft);
	}
	.check {
		color: var(--deep);
		font-weight: 700;
		flex: none;
	}
	.scopes {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.scope {
		flex: 1;
		min-width: 140px;
		min-height: 48px;
		border-radius: 12px;
		border: 1.5px solid var(--line);
		background: var(--card);
		font-size: 13.5px;
		font-weight: 700;
		color: var(--ink);
		padding: 10px 14px;
	}
	.scope.on {
		border-color: var(--green);
		background: var(--wash);
		color: var(--deep);
	}
	.scope:disabled {
		color: var(--soft);
	}
	.progress {
		margin: 0;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--soft);
		font-variant-numeric: tabular-nums;
	}
	.qcard {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.ask {
		margin: 0;
		font-family: var(--display);
		font-size: 19px;
		line-height: 1.25;
	}
	.qpic {
		width: 100%;
		max-height: 260px;
		object-fit: cover;
		border-radius: 12px;
		display: block;
		background: var(--stonewash);
	}
	.qpic.bark {
		max-height: 220px;
	}
	.passage {
		margin: 0;
		font-family: var(--display);
		font-size: 16px;
		line-height: 1.6;
		color: var(--ink);
		max-width: 62ch;
	}
	.answers {
		display: grid;
		gap: 8px;
	}
	.ans {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		width: 100%;
		min-height: 52px;
		padding: 12px 15px;
		border-radius: 13px;
		border: 1.5px solid var(--line);
		background: var(--card);
		font-size: 15px;
		font-weight: 600;
		color: var(--ink);
		text-align: left;
	}
	.ans:not(:disabled):hover {
		border-color: var(--green);
	}
	/* Right and wrong are named by the mark as well as the colour: the tick and
	   the cross carry it where colour cannot. The grounds stay pale so the label
	   keeps full-contrast ink on top of them. */
	.ans.correct {
		border-color: var(--green);
		background: var(--wash);
	}
	.ans.wrong {
		border-color: #b3261e;
		background: #fdeceb;
	}
	.mark {
		font-weight: 700;
		flex: none;
	}
	.ans.correct .mark {
		color: var(--deep);
	}
	.ans.wrong .mark {
		color: #8c1d18;
	}
	@media (prefers-color-scheme: dark) {
		.ans.wrong {
			background: #3a1f1d;
		}
		.ans.wrong .mark {
			color: #f2b8b5;
		}
	}
	.score {
		margin: 2px 0 0;
		font-family: var(--display);
		font-size: 15px;
	}
	.score strong {
		font-size: 30px;
		color: var(--deep);
		font-variant-numeric: tabular-nums;
	}
	.missed {
		display: flex;
		align-items: center;
		gap: 12px;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 15px;
		padding: 10px 12px;
		text-decoration: none;
		color: inherit;
		min-height: 66px;
	}
	.missed:hover {
		border-color: var(--green);
	}
	.missed img {
		width: 52px;
		height: 52px;
		border-radius: 11px;
		object-fit: cover;
		flex: none;
	}
	.mt {
		flex: 1;
		min-width: 0;
	}
	.mn {
		display: block;
		font-weight: 700;
		font-size: 14.5px;
	}
	.mb {
		display: block;
		font-size: 12.5px;
		line-height: 1.45;
		color: var(--soft);
		margin-top: 2px;
	}
	.chev {
		color: var(--soft);
		font-size: 20px;
		flex: none;
	}
	.more {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		margin-top: 6px;
		font-size: 13px;
		font-weight: 700;
		color: var(--deep);
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	@media (min-width: 900px) {
		.opt,
		.qcard,
		.answers,
		.missed,
		.scopes {
			max-width: 620px;
		}
	}
</style>
