/**
 * Canonical public origin.
 *
 * Open Graph tags must carry absolute URLs, and pages are prerendered at build
 * time when the deploy host is unknown — `page.url.origin` resolves to
 * SvelteKit's internal prerender host, which produced the nonsense
 * `http://sveltekit-prerender./images/og-card.jpg` in shipped meta tags.
 *
 * Renamed with the app in August 2026. The old host, meet-a-tree.vercel.app, is
 * gone rather than redirected: Vercel releases a freed .vercel.app subdomain
 * back to the pool, and a subdomain of vercel.app cannot be re-attached as a
 * redirect. Nothing public pointed at it, which is why the rename happened
 * before launch rather than after. Update this when a real domain is bought.
 */
export const SITE_URL = 'https://tree-hunt.vercel.app';

export const absoluteUrl = (path: string): string =>
	`${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
