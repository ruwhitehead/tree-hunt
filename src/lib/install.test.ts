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
});

