import { describe, expect, it } from 'vitest';

describe('install nudging', () => {
	const base = {
		installed: false,
		mobile: true,
		hasBrowserPrompt: false,
		snoozes: 0,
		snoozeUntil: null as string | null,
		visits: 2,
		earned: false,
		today: '2026-08-04'
	};

	it('stays quiet on a first visit, then asks on the second', async () => {
		const { shouldPrompt } = await import('./install.svelte');
		expect(shouldPrompt({ ...base, visits: 1 })).toBe(false);
		expect(shouldPrompt({ ...base, visits: 2 })).toBe(true);
	});

	it('asks immediately after a delight moment, even on visit one', async () => {
		const { shouldPrompt } = await import('./install.svelte');
		expect(shouldPrompt({ ...base, visits: 1, earned: true })).toBe(true);
	});

	it('never nags an installed app', async () => {
		const { shouldPrompt } = await import('./install.svelte');
		expect(shouldPrompt({ ...base, installed: true, earned: true })).toBe(false);
	});

	it('respects a snooze, then returns when it expires', async () => {
		const { shouldPrompt } = await import('./install.svelte');
		expect(shouldPrompt({ ...base, snoozes: 1, snoozeUntil: '2026-08-08' })).toBe(false);
		expect(shouldPrompt({ ...base, snoozes: 1, snoozeUntil: '2026-08-04' })).toBe(true);
	});

	it('takes three refusals as a final no', async () => {
		const { shouldPrompt } = await import('./install.svelte');
		expect(shouldPrompt({ ...base, snoozes: 3, snoozeUntil: null })).toBe(false);
	});

	it('is silent on desktop unless the browser offers an install', async () => {
		const { shouldPrompt } = await import('./install.svelte');
		expect(shouldPrompt({ ...base, mobile: false })).toBe(false);
		expect(shouldPrompt({ ...base, mobile: false, hasBrowserPrompt: true })).toBe(true);
	});

	/** The onboarding step teaches rather than asks, so a "later" there must not
	 *  spend the snooze budget the earned-moment ask depends on. Encoded as a test
	 *  because the two are easy to conflate when editing either one: a snooze
	 *  recorded during onboarding would silence the ask that actually converts. */
	it('an onboarding skip leaves the earned-moment ask fully intact', async () => {
		const { shouldPrompt } = await import('./install.svelte');
		// no snooze recorded, no visit credited: the first find still asks
		expect(shouldPrompt({ ...base, visits: 1, snoozes: 0, earned: true })).toBe(true);
	});
});

describe('early install-event capture', () => {
	/** Chrome fires beforeinstallprompt before hydration and never replays it, so
	 *  app.html catches it on window.__installEvent and the store adopts it. If
	 *  this regresses, Android silently loses the one-tap install and falls back
	 *  to reading three-dot-menu instructions — a failure with no error message,
	 *  which is why it is pinned here. */
	it('adopts a usable event stashed before hydration', async () => {
		const { adoptPrompt } = await import('./install.svelte');
		const userChoice = Promise.resolve({ outcome: 'accepted' });
		const adopted = adoptPrompt({ __installEvent: { prompt: async () => {}, userChoice } });
		expect(adopted).not.toBeNull();
		await expect(adopted!.userChoice).resolves.toEqual({ outcome: 'accepted' });
	});

	it('refuses anything that is not a usable event, rather than offering a dead button', async () => {
		const { adoptPrompt } = await import('./install.svelte');
		expect(adoptPrompt(undefined)).toBeNull();
		expect(adoptPrompt({})).toBeNull();
		expect(adoptPrompt({ __installEvent: null })).toBeNull();
		// half-set: a prompt with no userChoice would hang the await in the UI
		expect(adoptPrompt({ __installEvent: { prompt: async () => {} } })).toBeNull();
		// wrong shape entirely
		expect(adoptPrompt({ __installEvent: { prompt: 'nope', userChoice: {} } })).toBeNull();
	});
});

