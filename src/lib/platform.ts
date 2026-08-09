/**
 * Which recogniser the device in front of you actually has.
 *
 * The app no longer takes photographs or identifies them. When the keys have
 * run out, the honest last resort is the recogniser already on the phone -
 * Google Lens or Apple's Visual Look Up - and the instructions for reaching it
 * are completely different on each, so showing both would leave everyone
 * reading half a page that does not apply to them.
 *
 * There is no web API for either. They are OS features, and always have been,
 * so this can only ever be a signpost. `lens.google.com/uploadbyurl` would work
 * but needs the photo publicly hosted, which is not something this app will do.
 */
export type Platform = 'ios' | 'android' | 'desktop';

/** Pure, so the decision can be tested without a phone. */
export function platformFrom(opts: { ua: string; maxTouchPoints: number }): Platform {
	// iPadOS reports itself as a Macintosh. The touch points are what give it
	// away, and getting this wrong sends an iPad user Android instructions.
	const ios =
		/iphone|ipad|ipod/i.test(opts.ua) || (/Macintosh/.test(opts.ua) && opts.maxTouchPoints > 1);
	if (ios) return 'ios';
	if (/android/i.test(opts.ua)) return 'android';
	return 'desktop';
}

export function detectPlatform(): Platform {
	if (typeof navigator === 'undefined') return 'desktop';
	return platformFrom({ ua: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints ?? 0 });
}
