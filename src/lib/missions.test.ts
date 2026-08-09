import { describe, expect, it } from 'vitest';
import { SPECIES } from './content/species';

describe('seasonal missions', () => {
	it('windows cover every month of the year between them', async () => {
		const { MISSIONS, inWindow } = await import('./content/missions');
		for (let m = 0; m < 12; m++) {
			const mid = new Date(2026, m, 15);
			const live = MISSIONS.filter((mi) => inWindow(mi, mid));
			expect(live.length, `month ${m}`).toBeGreaterThan(0);
		}
	});

	it('handles a window that wraps the new year', async () => {
		const { MISSIONS, inWindow } = await import('./content/missions');
		const winter = MISSIONS.find((m) => m.id === 'evergreens')!;
		expect(inWindow(winter, new Date(2026, 11, 20))).toBe(true); // December
		expect(inWindow(winter, new Date(2026, 0, 10))).toBe(true); // January
		expect(inWindow(winter, new Date(2026, 5, 10))).toBe(false); // June
	});

	it('every mission is winnable from the species it lists', async () => {
		const { MISSIONS } = await import('./content/missions');
		const { speciesById } = await import('./content/species');
		for (const m of MISSIONS) {
			const real = m.ids.filter((id) => speciesById(id));
			expect(real.length, `${m.id} has unknown species ids`).toBe(m.ids.length);
			expect(real.length, `${m.id} target unreachable`).toBeGreaterThanOrEqual(m.target);
		}
	});
});

describe('a hunt counts sightings, not species already met', () => {
	it('ignores a grove entry dated before the window, and counts one inside it', async () => {
		const { progressFor } = await import('./missions.svelte');
		const { MISSIONS } = await import('./content/missions');
		const { grove } = await import('./grove.svelte');
		const summer = MISSIONS.find((m) => m.id === 'summer-shade')!;
		const july = new Date(2026, 6, 1);

		grove.finds = [{ id: 'oak', date: '2026-04-02' }];
		expect(progressFor(summer, july).done).toHaveLength(0);
		expect(progressFor(summer, july).todo.map((s) => s.id)).toContain('oak');

		// this is what the "Seen it" button does: a second, dated sighting
		grove.finds = [...grove.finds, { id: 'oak', date: '2026-07-01' }];
		expect(progressFor(summer, july).done.map((s) => s.id)).toEqual(['oak']);
		expect(grove.speciesCount, 'a re-sighting must not double-count').toBe(1);
	});
});

