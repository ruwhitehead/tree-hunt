<script lang="ts">
	import { install } from '$lib/install.svelte';

	/** The how-to, in one place.
	 *
	 *  These steps used to live inside InstallPrompt, reachable only after the
	 *  install bar had decided to appear — which is second visit onwards. So the
	 *  one moment someone is actively wondering "how do I keep this?", namely the
	 *  first run, was the one moment the answer was not on screen. It is now used
	 *  by the onboarding step, the install bar and the permanent entry in Learn,
	 *  and it lives here so those three cannot drift apart.
	 *
	 *  Naming the device matters more than it looks. "Add to Home Screen" is
	 *  buried in a long share sheet on iOS and behind a three-dot menu on
	 *  Android, and telling someone the wrong one is worse than saying nothing. */
	const p = install.platform;
</script>

{#if p.ios}
	<ol class="steps">
		{#if p.iosOtherBrowser}
			<li>
				Open this page in <strong>Safari</strong> — on iPhone only Safari can add to the home screen.
			</li>
		{/if}
		<li>
			Tap
			<span class="glyph" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
					<path d="M12 16V4" /><path d="M8 8l4-4 4 4" /><rect
						x="4"
						y="12"
						width="16"
						height="9"
						rx="2"
					/>
				</svg>
			</span>
			<strong>Share</strong>, in the bar at the bottom of Safari.
		</li>
		<li>Scroll the list and tap <strong>Add to Home Screen</strong>.</li>
		<li>Tap <strong>Add</strong>. Look for the green tree.</li>
	</ol>
{:else if p.android}
	<ol class="steps">
		<li>Tap the <strong>⋮</strong> menu, top right of Chrome.</li>
		<li>Tap <strong>Add to Home screen</strong> (or <strong>Install app</strong>).</li>
		<li>Confirm <strong>Install</strong>. Look for the green tree.</li>
	</ol>
{:else}
	<!-- Desktop had no instructions at all before: shouldPrompt() returns false
	     without a browser install offer, so the bar never appeared and there was
	     nothing to read. Someone on a laptop can still install this. -->
	<ol class="steps">
		<li>
			Look for the <strong>install icon</strong> in the address bar, at the right-hand end.
		</li>
		<li>Or open the browser menu and choose <strong>Install</strong> / <strong>Add to…</strong>.</li>
		<li>On a phone, this app can sit on your home screen and work with no signal.</li>
	</ol>
{/if}

<style>
	.steps {
		margin: 0;
		padding-left: 20px;
		font-size: var(--text-md);
		color: var(--soft);
		display: flex;
		flex-direction: column;
		gap: 7px;
	}
	.steps strong {
		color: var(--ink);
	}
	/* The Share glyph is drawn rather than described because the iOS share icon
	   has no name most people would recognise, and "the square with the arrow"
	   is a sentence nobody should have to read. */
	.glyph {
		display: inline-grid;
		place-items: center;
		width: 22px;
		height: 22px;
		border-radius: 5px;
		background: var(--wash);
		color: var(--deep);
		vertical-align: -5px;
	}
	.glyph svg {
		width: 14px;
		height: 14px;
	}
</style>
