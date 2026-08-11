<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';

	const to = `${base}/grove/`;
	$effect(() => {
		void goto(to, { replaceState: true });
	});
</script>

<svelte:head>
	<title>My Grove · Tree Hunt</title>
	<!-- the no-JS fallback, and a note to search engines that this is not the page -->
	<meta http-equiv="refresh" content="0; url={to}" />
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="view">
	<p>Taking you to <a href={to}>your grove</a>…</p>
</main>
