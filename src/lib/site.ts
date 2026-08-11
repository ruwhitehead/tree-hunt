/**
 * Canonical public origin.
 *
 * Open Graph tags must carry absolute URLs, and pages are prerendered at build
 * time when the deploy host is unknown — `page.url.origin` resolves to
 * SvelteKit's internal prerender host, which produced the nonsense
 * `http://sveltekit-prerender./images/og-card.jpg` in shipped meta tags.
 *
 * The host still carries the app's first name, Meet a Tree. Renaming the Vercel
 * project would change it, which would invalidate every card already shared and
 * strand the tombstone that forwards the retired GitHub Pages address — so the
 * hostname is a separate decision from the app's name, taken separately. Update
 * this when a real domain is bought.
 */
export const SITE_URL = 'https://meet-a-tree.vercel.app';

export const absoluteUrl = (path: string): string =>
	`${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
