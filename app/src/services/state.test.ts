import { describe, expect, it, vi } from 'vitest';

vi.stubGlobal('__PREVIEW__', false);
const { DATA_VERSION, migrate, defaults } = await import('./state');

describe('saved data migrations', () => {
  it('turns calorie targets from version 1 into protein, fat and carbs', () => {
    const s = migrate({ v: 1, onboarded: true, targets: { mode: 'same', same: { kcal: 2000, p: 120, f: 70 }, days: [] }, profile: { name: 'A', country: 'PL', store: 'Frisco' } });
    expect(s.v).toBe(DATA_VERSION);
    expect(s.targets.same).toEqual({ p: 120, f: 70, c: Math.round((2000 - 480 - 630) / 4) });
    expect(s.targets.days).toHaveLength(7);
  });
  it('moves people off removed stores and countries', () => {
    expect(migrate({ v: 3, profile: { name: 'A', country: 'PL', store: 'Auchan' } }).profile.store).toBe('Frisco');
    const gone = migrate({ v: 4, profile: { name: 'A', country: 'DE', store: 'Lidl' }, shopping: { view: 'meal', entries: [] } });
    expect(gone.profile).toEqual({ name: 'A', country: 'PL', store: 'Frisco' });
    expect(gone.shopping.lang).toBe('orig');
  });
  it('keeps current data as it is and fills in anything missing', () => {
    const cur = { ...defaults(), onboarded: true, profile: { name: 'Rand', country: 'IS', store: 'Krónan' }, extra: 1 };
    const s = migrate(JSON.parse(JSON.stringify(cur)));
    expect(s.profile).toEqual(cur.profile);
    expect(s.extra).toBe(1);
    const partial = migrate({ v: 5, onboarded: true, library: { favorites: ['x'] } });
    expect(partial.library.favorites).toEqual(['x']);
    expect(partial.library.recipes).toEqual([]);
    expect(partial.libSort.recipes).toBe('new');
  });
});
