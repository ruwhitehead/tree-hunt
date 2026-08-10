<script lang="ts">
	/**
	 * The profile of a whole tree, for a species you have not found yet.
	 *
	 * Filled rather than outlined, unlike the leaf key's silhouettes: a leaf
	 * diagram has to show the margin and the lobes, whereas a crown at 100px is
	 * read entirely by its outline against the ground, and an outlined crown at
	 * this size turns into a grey scribble.
	 *
	 * Everything is `currentColor`, so it survives forced-colours mode — which is
	 * exactly what the greyed-out photograph this replaced did not do, since that
	 * mode drops CSS filters and left found and unfound looking identical.
	 */
	import type { CrownShape } from '$lib/content/types';

	let { shape, size = 72 }: { shape: CrownShape; size?: number } = $props();
</script>

<span class="wrap" style="--s:{size}px" aria-hidden="true">
	<svg viewBox="0 0 100 100" fill="currentColor">
		{#if shape === 'spreading'}
			<!-- broad low dome, wider than tall: oak, beech, plane -->
			<path d="M50 96V60" stroke="currentColor" stroke-width="7" />
			<path d="M50 62c-26 0-42-11-42-25C8 22 27 10 50 10s42 12 42 27c0 14-16 25-42 25z" />
			<path d="M50 66c-9 0-16-6-24-12M50 66c9 0 16-6 24-12" stroke="currentColor" stroke-width="5" fill="none" />
		{:else if shape === 'domed'}
			<!-- neat compact ball on a clear trunk: rowan, whitebeam, field maple -->
			<path d="M50 96V56" stroke="currentColor" stroke-width="7" />
			<ellipse cx="50" cy="38" rx="30" ry="30" />
		{:else if shape === 'arching'}
			<!-- light crown, outer twigs falling away: birch -->
			<path d="M50 96V26" stroke="currentColor" stroke-width="6" />
			<path
				d="M50 24c-14 2-24 12-28 28 8-12 16-18 28-20zM50 24c14 2 24 12 28 28-8-12-16-18-28-20zM50 40c-12 3-20 12-24 26 8-11 14-16 24-18zM50 40c12 3 20 12 24 26-8-11-14-16-24-18zM50 10c-8 2-13 7-16 15 6-7 10-10 16-11zM50 10c8 2 13 7 16 15-6-7-10-10-16-11z"
			/>
		{:else if shape === 'columnar'}
			<!-- tall narrow column: Lombardy poplar, a clipped leylandii -->
			<path d="M50 98V80" stroke="currentColor" stroke-width="6" />
			<path d="M50 4c11 0 17 14 17 40s-6 40-17 40-17-14-17-40S39 4 50 4z" />
		{:else if shape === 'conical'}
			<!-- even cone to a single leader: spruce, larch, alder -->
			<path d="M50 98V84" stroke="currentColor" stroke-width="6" />
			<path d="M50 4 78 86H22z" />
		{:else if shape === 'flat-topped'}
			<!-- bare trunk under horizontal tiers: Scots pine, cedar, monkey puzzle -->
			<path d="M50 98V44" stroke="currentColor" stroke-width="7" />
			<path d="M14 40h72c0 7-16 12-36 12s-36-5-36-12z" />
			<path d="M24 24h52c0 6-12 10-26 10s-26-4-26-10z" />
			<path d="M34 10h32c0 5-7 8-16 8s-16-3-16-8z" />
		{:else if shape === 'weeping'}
			<!-- curtain falling to the ground: weeping willow -->
			<path d="M50 98V52" stroke="currentColor" stroke-width="7" />
			<path d="M50 12c-22 0-36 12-36 26 0-8 6-12 10-6 3-8 9-8 12 0 3-10 9-10 12 0 3-10 9-10 12 0 3-8 9-8 12 0 4-6 10-2 10 6 0-14-14-26-36-26z" />
			<path d="M18 40c-2 16 0 28 4 36M34 44c-2 18 0 30 3 38M50 46c0 18 0 30 1 38M66 44c2 18 0 30-3 38M82 40c2 16 0 28-4 36" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" />
		{:else if shape === 'vase'}
			<!-- trunk dividing low into upswept limbs: ash, wych elm -->
			<path d="M50 98V64" stroke="currentColor" stroke-width="7" />
			<path d="M50 66c-6-14-18-22-34-24 12 6 18 14 20 26zM50 66c6-14 18-22 34-24-12 6-18 14-20 26z" />
			<path d="M50 62c-4-16-10-26-18-34 10 6 16 16 18 30zM50 62c4-16 10-26 18-34-10 6-16 16-18 30z" />
			<path d="M50 58c0-18 0-32 0-44 2 14 4 28 2 44z" />
		{:else}
			<!-- many stems from the ground, no single trunk: hazel, elder, blackthorn -->
			<path d="M50 98V70M50 84 32 66M50 84l18-18" stroke="currentColor" stroke-width="6" fill="none" />
			<ellipse cx="30" cy="52" rx="20" ry="18" />
			<ellipse cx="70" cy="52" rx="20" ry="18" />
			<ellipse cx="50" cy="38" rx="23" ry="20" />
		{/if}
	</svg>
</span>

<style>
	.wrap {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
	}
	svg {
		width: var(--s);
		height: var(--s);
		max-width: 78%;
		max-height: 78%;
	}
</style>
