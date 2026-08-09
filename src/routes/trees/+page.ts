import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';

// Following individual trees through the year is gone, so what lived at /trees
// is now just the species you have met — which is a grove, and which is what
// the app has always called it everywhere else. The route swapped rather than
// the name changing again: /grove was the redirect and is now the page.
//
// Kept because installed copies have /trees as a start URL and shared cards
// point at it.
export const prerender = false;
export const ssr = false;

export function load() {
	redirect(308, `${base}/grove/`);
}
