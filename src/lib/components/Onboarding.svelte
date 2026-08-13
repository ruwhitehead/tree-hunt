<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { SPECIES } from '$lib/content/species';
	import { install } from '$lib/install.svelte';
	import HowToInstall from '$lib/components/HowToInstall.svelte';

	/** Three screens, then the key. Without this a new arrival faces a fact, a
	 *  featured tree, four cards and an install bar with no idea what the app is
	 *  for — everything else only pays off after the first success.
	 *
	 *  Screen two used to sell following one tree through a year, which was the
	 *  best thing here until it was removed (see REDESIGN.md). It kept selling it
	 *  for some time afterwards: the one screen a new arrival reads most closely
	 *  promised a feature the app no longer had, and said nothing about the loop
	 *  it does have. It now describes that loop, and names the Grove, which is
	 *  otherwise a charming but opaque word on the tab bar. */
	const KEY = 'mat-seen-intro';
	let step = $state(0);
	let open = $state(browser ? localStorage.getItem(KEY) !== '1' : false);

	function done() {
		open = false;
		if (browser) localStorage.setItem(KEY, '1');
	}

	/** The home-screen screen.
	 *
	 *  It TEACHES rather than asks. The expensive thing on Android is calling
	 *  prompt() on someone who has not yet named a tree: Chrome suppresses its
	 *  install prompt for about three months after a dismissal, and the deferred
	 *  event can only be used once — so a mistimed no is close to permanent while
	 *  a well-timed yes is cheap. Showing instructions costs nothing, and on
	 *  iPhone instructions are the only thing possible anyway: there is no
	 *  programmatic install in Safari at all.
	 *
	 *  So: the steps are always visible here, and the native one-tap install is
	 *  offered only where the browser has actually given us one. Skipping this
	 *  screen deliberately does NOT call install.snooze() — the earned-moment ask
	 *  after the first tree is added is the real ask, and this must not spend its
	 *  budget. Nor does it appear at all if the app is already installed. */
	const showInstallStep = $derived(!install.installed && !install.platform.standalone);

	let installing = $state(false);

	async function installNow() {
		if (!install.prompt) return;
		installing = true;
		try {
			await install.prompt.prompt();
			const choice = await install.prompt.userChoice.catch(() => null);
			install.prompt = null;
			if (choice?.outcome === 'accepted') install.markInstalled();
			// a no here is left unrecorded on purpose: see above
		} finally {
			installing = false;
		}
	}

	const screens = $derived([
		{
			eyebrow: 'Tree Hunt',
			title: 'Learn the trees you already walk past',
			body: `A field guide to ${SPECIES.length} British and Irish trees — how to spot each one, the stories people told about it, and the science underneath. Free, no ads, works with no signal.`,
			howTo: false
		},
		{
			eyebrow: 'How it works',
			title: 'Six trees cover most British streets',
			body: `Work a tree out yourself from its leaf, its bark or its fruit — no photograph, no signal, no server. Each one you name joins My Trees, the deck of all ${SPECIES.length} that shows what you have learned, what is still out there, and quizzes you on it.`,
			howTo: false
		},
		{
			eyebrow: 'Why it is free',
			title: 'If you fall for trees, plant one',
			body: 'Nothing is locked and nothing is sold. When it has earned it, the app points you at the International Tree Foundation, who plant real trees with the people who live among them.',
			howTo: false
		},
		...(showInstallStep
			? [
					{
						eyebrow: 'Keep it with you',
						title: 'Put it on your home screen',
						body: 'A field guide is no use if you cannot find it when you are standing under the tree. On your home screen it opens like any other app and works with no signal.',
						howTo: true
					}
				]
			: [])
	]);
</script>

{#if open}
	<div class="scrim" role="dialog" aria-modal="true" aria-labelledby="intro-title">
		<div class="sheet">
			<div class="art" aria-hidden="true">
				<span class="leaf l1"></span><span class="leaf l2"></span><span class="leaf l3"></span>
			</div>

			<p class="eyebrow">{screens[step].eyebrow}</p>
			<h2 id="intro-title">{screens[step].title}</h2>
			<p class="body">{screens[step].body}</p>

			{#if screens[step].howTo}
				<!-- The instructions are on screen from the moment this step opens.
				     Hiding them behind a "how?" tap is what made them unfindable in
				     the install bar, and on iPhone they are the only route there is. -->
				<div class="howto">
					<img class="icon" src="{base}/icons/icon-192.png" alt="" width="40" height="40" />
					<HowToInstall />
				</div>
			{/if}

			<div class="dots" aria-hidden="true">
				{#each screens as _, i (i)}
					<span class="dot" class:on={i === step}></span>
				{/each}
			</div>

			<div class="actions">
				{#if step < screens.length - 1}
					<button class="btn" onclick={() => (step += 1)}>Next</button>
					<button class="btn ghost" onclick={done}>Skip</button>
				{:else if screens[step].howTo}
					<!-- Whichever branch, the flow still ends by pushing someone at a real
					     tree. Onboarding used to end on "Identify a tree" and that is the
					     best thing it did; the install step must not cost it. -->
					{#if install.prompt}
						<!-- Only where the browser has actually offered an install. One tap,
						     the real system sheet, no instructions needed. -->
						<button class="btn" onclick={installNow} disabled={installing}>
							{installing ? 'Adding…' : 'Add to home screen'}
						</button>
						<a class="btn ghost" href="{base}/identify/" onclick={done}>Identify a tree</a>
					{:else}
						<a class="btn" href="{base}/identify/" onclick={done}>Identify a tree</a>
					{/if}
				{:else}
					<a class="btn" href="{base}/identify/" onclick={done}>Identify a tree</a>
					<button class="btn ghost" onclick={done}>Have a look round</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 70;
		display: grid;
		place-items: end center;
		background: rgba(18, 27, 20, 0.55);
		padding: 16px;
	}
	.sheet {
		background: var(--paper);
		border-radius: 22px;
		padding: 22px 22px 20px;
		width: 100%;
		max-width: 420px;
		box-shadow: var(--shadow);
	}
	.art {
		height: 74px;
		position: relative;
		margin-bottom: 14px;
	}
	.leaf {
		position: absolute;
		border-radius: 0 60% 0 60%;
		background: linear-gradient(135deg, #4fa372, var(--green));
	}
	.l1 {
		width: 52px;
		height: 52px;
		left: 0;
		top: 12px;
		transform: rotate(-12deg);
	}
	.l2 {
		width: 38px;
		height: 38px;
		left: 46px;
		top: 30px;
		opacity: 0.75;
		transform: rotate(14deg);
	}
	.l3 {
		width: 26px;
		height: 26px;
		left: 84px;
		top: 6px;
		opacity: 0.5;
		transform: rotate(-24deg);
	}
	.eyebrow {
		margin: 0;
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--deep);
	}
	h2 {
		font-family: var(--display);
		font-weight: 400;
		font-size: var(--text-3xl);
		line-height: 1.15;
		margin: 6px 0 10px;
		text-wrap: balance;
	}
	.body {
		margin: 0;
		font-size: var(--text-md);
		line-height: 1.6;
		color: var(--soft);
	}
	/* The icon sits beside the steps for the same reason the install bar shows it:
	   it is the actual generated icon, so it previews the thing that will appear
	   on the home screen and cannot drift from it. */
	.howto {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		margin: 13px 0 0;
		padding: 12px 13px;
		background: var(--wash);
		border: 1px solid var(--wash-line);
		border-radius: 12px;
	}
	.howto .icon {
		width: 40px;
		height: 40px;
		display: block;
		flex: none;
	}
	.dots {
		display: flex;
		gap: 6px;
		margin: 16px 0 14px;
	}
	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--line);
	}
	.dot.on {
		background: var(--green);
		width: 20px;
		border-radius: 999px;
	}
	.actions {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}
</style>
