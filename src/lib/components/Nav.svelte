<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import TreeMark from '$lib/components/TreeMark.svelte';

	/** One flat row, no raised action.
	 *
	 *  The centre used to be a green camera button, and removing the camera left
	 *  a hole in the middle of the primary navigation. Nothing else here deserves
	 *  to be raised above the rest - promoting a destination just because a slot
	 *  came free is how navigation rots - so the bar went flat.
	 *
	 *  Seasons came off the bar in the same pass: it answers the same question as
	 *  Today, and Today is where its live hunt now appears. The full board is
	 *  still at /missions, one tap away, the way Learn's depth is. */
	const items = [
		{ href: '/', label: 'Today', icon: 'sun' },
		{ href: '/grove', label: 'My Trees', icon: 'leaf' },
		{ href: '/identify', label: 'Identify', icon: 'search' },
		{ href: '/quiz', label: 'Quiz', icon: 'quiz' },
		{ href: '/learn', label: 'Learn', icon: 'book' }
	];

	const isActive = (href: string) =>
		href === '/'
			? page.url.pathname === `${base}/` || page.url.pathname === base
			: page.url.pathname.startsWith(base + href);
</script>

{#snippet icon(name: string)}
	{#if name === 'sun'}
		<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" /></svg>
	{:else if name === 'pin'}
		<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.6" /></svg>
	{:else if name === 'leaf'}
		<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 21c0-9 3-15 12-17-1 9-4 14-12 17z" /><path d="M6 21c2-5 5-9 9-12" /></svg>
	{:else if name === 'season'}
		<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 3v9l6 3" /></svg>
	{:else if name === 'quiz'}
		<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 9a3 3 0 1 1 4 2.8c-.7.3-1 .9-1 1.7v.5" /><path d="M12 17.5v.5" /><circle cx="12" cy="12" r="9.2" /></svg>
	{:else if name === 'search'}
		<!-- a lens over a leaf, not a camera: identifying is now looking closely at
		     the tree in front of you, and nothing here photographs anything -->
		<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" /><path d="M8 14.5c0-4.5 1.6-7.2 6-8-.5 4.5-2 6.8-6 8z" /></svg>
	{:else}
		<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5c-2-1.5-5-2-8-1.5v14C7 17 10 17.5 12 19c2-1.5 5-2 8-1.5v-14C17 3 14 3.5 12 5z" /><path d="M12 5v14" /></svg>
	{/if}
{/snippet}

<!-- mobile: bottom tab bar. Tabs REPLACE history so Back never walks a trail of
     tab switches (and so the first Back from the app root exits cleanly). -->
<nav class="tabbar" aria-label="Main">
	{#each items as item (item.href)}
		<a
			class="nav-btn"
			href="{base}{item.href}"
			aria-current={isActive(item.href) ? 'page' : undefined}
			data-sveltekit-replacestate
		>
			{@render icon(item.icon)}{item.label}
		</a>
	{/each}
</nav>

<!-- desktop: persistent side rail -->
<div class="rail">
	<p class="railmark"><TreeMark size={28} />Tree Hunt</p>
	<nav aria-label="Sections">
		{#each items as item (item.href)}
			<a
				class="rail-btn"
				href="{base}{item.href}"
				aria-current={isActive(item.href) ? 'page' : undefined}
				data-sveltekit-replacestate
			>
				{@render icon(item.icon)}<span>{item.label}</span>
			</a>
		{/each}
	</nav>
	<p class="railfoot">
		Free forever, in support of the <strong>International Tree Foundation</strong>, registered
		charity no. 1106269
	</p>
</div>

<style>
	.tabbar {
		flex: none;
		display: flex;
		justify-content: space-around;
		align-items: center;
		padding: 8px 6px calc(10px + env(safe-area-inset-bottom));
		border-top: 1px solid var(--line);
		background: var(--card);
		z-index: 20;
	}
	.nav-btn {
		font-size: var(--text-2xs);
		font-weight: 700;
		color: var(--soft);
		text-align: center;
		width: 64px;
		min-height: 48px;
		border-radius: 10px;
		text-decoration: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.nav-btn[aria-current='page'] {
		color: var(--deep);
	}
	:global(.ic) {
		display: block;
		width: 22px;
		height: 22px;
		margin: 0 auto 3px;
	}

	.rail {
		display: none;
	}
	@media (min-width: 900px) {
		.tabbar {
			display: none;
		}
		.rail {
			display: flex;
			flex-direction: column;
			gap: 22px;
			position: sticky;
			top: 0;
			align-self: start;
			height: 100dvh;
			padding: 34px 20px 24px;
			border-right: 1px solid var(--line);
			background: var(--card);
			grid-column: 1;
			grid-row: 1 / 3;
		}
		.rail nav {
			display: flex;
			flex-direction: column;
			gap: 4px;
		}
		/* the same lockup as the top bar, one step up in size for the rail */
		/* matches the mobile wordmark's treatment one step up, since the rail has
		   232px to play with and this is the only place the brand appears on
		   desktop. Tracking eases off with the size, as in TopBar. */
		.railmark {
			display: flex;
			align-items: center;
			gap: 10px;
			margin: 0;
			font-family: var(--display);
			font-weight: 700;
			font-size: var(--text-base);
			text-transform: uppercase;
			letter-spacing: 0.12em;
			color: var(--deep);
		}
		.rail-btn {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 11px 13px;
			border-radius: 11px;
			font-size: var(--text-base);
			font-weight: 600;
			color: var(--ink);
			text-decoration: none;
			min-height: 44px;
			transition: background 0.12s ease;
		}
		.rail-btn :global(.ic) {
			margin: 0;
			width: 20px;
			height: 20px;
			flex: none;
		}
		.rail-btn:hover {
			background: var(--stonewash);
		}
		.rail-btn[aria-current='page'] {
			background: var(--wash);
			color: var(--deep);
			font-weight: 700;
		}
		.railfoot {
			margin: auto 0 0;
			font-size: var(--text-xs);
			line-height: 1.45;
			color: var(--soft);
		}
		.railfoot strong {
			color: var(--ink);
			font-weight: 600;
		}
	}
</style>
