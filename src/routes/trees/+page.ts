// Following individual trees through the year is gone, so what lived at /trees
// is now just the species you have met — which is a grove, and which is what the
// app has always called it everywhere else. The route swapped rather than the
// name changing again: /grove was the redirect and is now the page.
//
// Kept because installed copies have /trees as a start URL and shared cards
// point at it.
//
// Prerendered, not a server redirect. The old stub used `prerender = false`,
// which made adapter-vercel build a serverless function for what is three lines
// of "go over there" — needless cost and latency, no use offline, and on Windows
// the symlink it needs fails the local build outright. A static page redirects
// just as well: the meta refresh covers no-JS, `goto` covers everything else,
// and the service worker can cache it.
export const prerender = true;
