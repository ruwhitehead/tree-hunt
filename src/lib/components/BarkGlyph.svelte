<script lang="ts">
	/** Diagrammatic bark textures for the bark key, drawn to the same rule as the
	 *  leaf silhouettes: a schematic of the pattern, never an imitation of a
	 *  photograph. Each one is a patch of trunk seen square on. */
	import type { BarkTexture } from '$lib/content/types';

	let { texture, size = 44 }: { texture: BarkTexture; size?: number } = $props();
</script>

<span class="wrap" style="--s:{size}px" aria-hidden="true">
	<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
		{#if texture === 'smooth'}
			<!-- nothing to catch on: the patch outline, and one faint sweep -->
			<rect x="16" y="16" width="68" height="68" rx="10" />
			<path d="M30 62c14-10 26-10 40 0" stroke-width="3" opacity="0.5" />
		{:else if texture === 'peeling'}
			<!-- horizontal ribbons lifting at one end -->
			<rect x="16" y="16" width="68" height="68" rx="10" />
			{#each [34, 50, 66] as y (y)}
				<path d="M22 {y}h40c6 0 10-4 16-7" />
			{/each}
		{:else if texture === 'banded'}
			<!-- unbroken horizontal lenticel bands, with the dashes that mark them -->
			<rect x="16" y="16" width="68" height="68" rx="10" />
			{#each [36, 52, 68] as y (y)}
				<path d="M22 {y}h56" stroke-width="3" />
				<path d="M32 {y}h8M52 {y}h10M70 {y}h4" stroke-width="6" />
			{/each}
		{:else if texture === 'ridged'}
			<!-- vertical ridges with clefts, interlacing like an ash or an oak -->
			<rect x="16" y="16" width="68" height="68" rx="10" />
			<path d="M34 20v22l-8 16 8 22M50 20v14l8 18-8 16v12M66 20v26l-8 14 8 22" />
		{:else if texture === 'flaking'}
			<!-- plates breaking away, a different ground showing between them -->
			<rect x="16" y="16" width="68" height="68" rx="10" />
			<path d="M22 40h24v20H22zM54 32h22v22H54zM30 66h20v14H30zM58 62h18v18H58z" stroke-width="3" />
		{:else}
			<!-- fibrous: vertical strings shredding away from the trunk -->
			<rect x="16" y="16" width="68" height="68" rx="10" />
			<path d="M30 20c-3 20 3 40 0 60M44 20c4 20-4 40 0 60M58 20c-3 20 4 40 0 60M72 20c3 20-4 40 0 60" stroke-width="3" />
		{/if}
	</svg>
</span>

<style>
	.wrap {
		display: inline-grid;
		place-items: center;
		width: var(--s);
		height: var(--s);
		color: var(--deep);
	}
	svg {
		width: 100%;
		height: 100%;
	}
</style>
