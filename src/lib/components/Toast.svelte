<script lang="ts">
	import { base } from '$app/paths';
	import { grove } from '$lib/grove.svelte';

	/** Two shapes in one element on purpose.
	 *
	 *  Most toasts are notifications — removed, seen again — and a pill of text is
	 *  right for those. A new species is the one message that is a win, and it gets
	 *  the tree's own photograph, its name, and the count of trees the reader can
	 *  now name. It stays one element so the fade is a single transition rather than
	 *  one pill swapping for another mid-flight. */
	const find = $derived(grove.toastFind);
	const on = $derived(grove.toastMsg !== null);
</script>

<div class="toast" class:on class:find={find !== null} role="status" aria-live="polite">
	{#if find}
		<img
			class="thumb"
			src="{base}/images/species/{find.id}-thumb.webp"
			alt=""
			width="120"
			height="120"
		/>
		<span class="copy">
			<span class="name">{find.name}</span>
			<span class="count">
				{find.count} {find.count === 1 ? 'tree' : 'trees'} you can name
			</span>
		</span>
	{:else}
		{grove.toastMsg ?? ''}
	{/if}
</div>

<style>
	.toast {
		position: fixed;
		left: 50%;
		bottom: 96px;
		z-index: 60;
		background: var(--forest);
		color: #f2f1ea;
		font-size: var(--text-md);
		font-weight: 600;
		padding: 10px 18px;
		border-radius: 999px;
		opacity: 0;
		visibility: hidden;
		/* translateX centres it; translateY is the arrival. Both live in one
		   transform so they cannot fight each other. */
		transform: translateX(-50%) translateY(8px);
		transition: opacity 0.25s, visibility 0.25s, transform 0.25s;
		pointer-events: none;
		max-width: 88vw;
	}
	@media (prefers-color-scheme: dark) {
		.toast {
			background: #e9eddc;
			color: #1c3b23;
		}
	}
	.toast.on {
		opacity: 1;
		visibility: visible;
		transform: translateX(-50%) translateY(0);
	}
	/* The win form: a card rather than a pill, because it has a picture in it and
	   two lines to read. */
	.toast.find {
		display: flex;
		align-items: center;
		gap: 11px;
		padding: 9px 16px 9px 9px;
		border-radius: 16px;
		box-shadow: var(--shadow);
	}
	.toast.find.on {
		/* a short overshoot, so it arrives rather than appears. Small on purpose:
		   this fires on every find, and a bounce that delights at find three is
		   tiresome by find thirty. */
		animation: land 380ms cubic-bezier(0.2, 1.5, 0.4, 1);
	}
	.thumb {
		width: 42px;
		height: 42px;
		border-radius: 10px;
		object-fit: cover;
		display: block;
		flex: none;
		background: rgba(255, 255, 255, 0.15);
	}
	.copy {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.name {
		font-size: var(--text-md);
		font-weight: 700;
		line-height: 1.2;
	}
	.count {
		font-size: var(--text-sm);
		font-weight: 500;
		opacity: 0.82;
		line-height: 1.3;
	}
	@keyframes land {
		from {
			transform: translateX(-50%) translateY(14px) scale(0.96);
		}
		to {
			transform: translateX(-50%) translateY(0) scale(1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.toast {
			transition: opacity 0.25s, visibility 0.25s;
			transform: translateX(-50%);
		}
		.toast.on {
			transform: translateX(-50%);
		}
		.toast.find.on {
			animation: none;
		}
	}
</style>
