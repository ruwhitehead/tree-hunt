import { describe, expect, it } from 'vitest';
import { platformFrom } from './platform';

const IPHONE =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1';
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15';
const ANDROID =
	'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36';
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

describe('which recogniser this device actually has', () => {
	it('names each platform, so nobody is shown instructions for a device they are not holding', () => {
		expect(platformFrom({ ua: IPHONE, maxTouchPoints: 5 })).toBe('ios');
		expect(platformFrom({ ua: ANDROID, maxTouchPoints: 5 })).toBe('android');
		expect(platformFrom({ ua: WINDOWS, maxTouchPoints: 0 })).toBe('desktop');
	});

	it('recognises iPadOS, which lies about being a Mac', () => {
		// the touch points are the only tell, and getting this wrong sends an iPad
		// owner to Chrome's right-click menu
		expect(platformFrom({ ua: IPAD, maxTouchPoints: 5 })).toBe('ios');
		expect(platformFrom({ ua: IPAD, maxTouchPoints: 0 })).toBe('desktop');
	});

	it('treats every iOS browser as WebKit, because they all are', () => {
		for (const ua of [
			'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) CriOS/120 Mobile Safari/604.1',
			'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) FxiOS/121 Mobile Safari/604.1'
		])
			expect(platformFrom({ ua, maxTouchPoints: 5 }), ua).toBe('ios');
	});

	it('falls back to desktop rather than guessing', () => {
		// an unknown agent gets the upload-to-Lens route, which works anywhere,
		// instead of being told to open an app it may not have
		expect(platformFrom({ ua: '', maxTouchPoints: 0 })).toBe('desktop');
		expect(platformFrom({ ua: 'some future browser', maxTouchPoints: 0 })).toBe('desktop');
	});

	it('never reports Android for an iOS device', () => {
		// "like Mac OS X" and some in-app browsers have tripped this before
		expect(platformFrom({ ua: IPHONE + ' Android', maxTouchPoints: 5 })).toBe('ios');
	});
});
