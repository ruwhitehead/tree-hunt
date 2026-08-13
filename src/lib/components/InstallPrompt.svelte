<script lang="ts">
	import { base } from '$app/paths';
	import { install } from '$lib/install.svelte';
	import { grove } from '$lib/grove.svelte';
	import { SPECIES } from '$lib/content/species';
	import HowToInstall from '$lib/components/HowToInstall.svelte';

	/** Sits in the page flow directly under the top bar, on every screen — a
	 *  floating bar would cover content and fail the touch-target audit.
	 *
	 *  The steps used to hide behind a "How to add it" tap. On iPhone that tap was
	 *  the only route to the only method that exists, which made the instructions
	 *  a secret: two taps to learn something we could simply have said. Where the
	 *  browser gives us no install event, the steps now show immediately and the
	 *  button is just "it's added". */
	const canPromptNatively = $derived(install.prompt !== null);

	// Copy earns its keep by naming what the user already has to lose.
	const reason = $derived(
		grove.speciesCount > 0
			? `My Trees holds ${grove.speciesCount} ${grove.speciesCount === 1 ? 'species' : 'species'}. Keep it in your pocket.`
			: `All ${SPECIES.length} trees, pictures included, work with no signal once it’s on your home screen.`
	);

	async function act() {
		if (!install.prompt) return;
		await install.prompt.prompt();
		const choice = await install.prompt.userChoice.catch(() => null);
		install.prompt = null;
		if (choice?.outcome === 'accepted') install.markInstalled();
		else install.snooze();
	}

	interface BeforeInstallPromptEvent extends Event {
		prompt: () => Promise<void>;
		userChoice: Promise<{ outcome: string }>;
	}

	function onBeforeInstall(e: Event) {
		e.preventDefault();
		const evt = e as BeforeInstallPromptEvent;
		install.prompt = { prompt: () => evt.prompt(), userChoice: evt.userChoice };
	}

	$effect(() => {
		const installed = () => install.markInstalled();
		window.addEventListener('appinstalled', installed);
		return () => window.removeEventListener('appinstalled', installed);
	});
</script>

<svelte:window onbeforeinstallprompt={onBeforeInstall} />

{#if install.shouldAsk}
	<aside class="bar" aria-labelledby="install-title">
		<div class="head">
			<!-- the generated icon itself, not a re-creation of it: this is a preview
			     of what lands on the home screen, so it must not be able to drift -->
			<img class="icon" src="{base}/icons/icon-192.png" alt="" width="40" height="40" />
			<div class="copy">
				<p class="t" id="install-title">Add Tree Hunt to your home screen</p>
				<p class="b">{reason}</p>
			</div>
		</div>

		{#if canPromptNatively}
			<!-- One tap to the real system sheet: instructions would be noise. -->
			<div class="row">
				<button class="btn small" onclick={act}>Install</button>
				<button class="btn ghost small" onclick={() => install.snooze()}>Not now</button>
			</div>
		{:else}
			<HowToInstall />
			<div class="row">
				<button class="btn small" onclick={() => install.markInstalled()}>Done, it's added</button>
				<button class="btn ghost small" onclick={() => install.snooze()}>Not now</button>
			</div>
		{/if}
	</aside>
{/if}

<style>
	.bar {
		margin: 0 16px;
		background: var(--card);
		border: 1.5px solid var(--green);
		border-radius: 16px;
		padding: 13px 14px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		flex: none;
	}
	.head {
		display: flex;
		align-items: flex-start;
		gap: 12px;
	}
	.icon {
		width: 40px;
		height: 40px;
		display: block;
		flex: none;
		/* the PNG carries its own rounded corners, so none are added here */
	}
	.copy {
		min-width: 0;
	}
	.t {
		margin: 0;
		font-weight: 700;
		font-size: var(--text-md);
		line-height: 1.3;
	}
	.b {
		margin: 3px 0 0;
		font-size: var(--text-sm);
		color: var(--soft);
	}
	@media (min-width: 900px) {
		.bar {
			margin: 0 48px;
			max-width: 520px;
		}
	}
</style>
