<script lang="ts">
	import { base } from '$app/paths';
	import credits from '$lib/content/credits.json';

	let {
		id,
		kind,
		alt,
		height = 200,
		priority = false
	}: {
		id: string;
		kind: 'tree' | 'leaf' | 'bark';
		alt: string;
		height?: number;
		priority?: boolean;
	} = $props();

	/** Bark is cropped square rather than 4:3, because a bark photograph is a
	 *  texture sample and a square keeps the same field of view across all of
	 *  them. Comparing barks shot at different magnifications is worthless. */
	const w = $derived(kind === 'bark' ? 800 : 900);
	const h = $derived(kind === 'bark' ? 800 : 675);
	const CAPTION = { tree: 'The whole tree', leaf: 'Leaf detail', bark: 'Mature bark' } as const;

	const credit = $derived(
		(credits as Record<string, Record<string, { artist: string; license: string; page: string }>>)[id]?.[
			kind
		]
	);
</script>

<figure class="photo" style="--h:{height}px">
	<img
		src="{base}/images/species/{id}-{kind}.webp"
		srcset="{base}/images/species/{id}-{kind}-480.webp 480w, {base}/images/species/{id}-{kind}.webp 900w"
		sizes="(min-width: 700px) 440px, 100vw"
		{alt}
		width={w}
		height={h}
		loading={priority ? 'eager' : 'lazy'}
		fetchpriority={priority ? 'high' : 'auto'}
		decoding="async"
	/>
	<figcaption>
		{CAPTION[kind]}
		{#if credit}
			· <a href={credit.page} target="_blank" rel="noopener">{credit.artist || 'Wikimedia'}</a>,
			{credit.license}
		{/if}
	</figcaption>
</figure>

<style>
	.photo {
		margin: 0;
	}
	img {
		width: 100%;
		height: var(--h);
		object-fit: cover;
		border-radius: 14px;
		display: block;
		background: var(--stonewash);
	}
	figcaption {
		font-size: 10.5px;
		color: var(--soft);
		margin-top: 5px;
		line-height: 1.4;
	}
	figcaption a {
		color: var(--soft);
	}
</style>
