import { beforeEach, describe, expect, it } from 'vitest';

import {
  getMissionStates,
  incrementMission,
  resetMissionProgress,
} from '../../../src/core/missions/missions';

type LocalStorageStub = {
  store: Map<string, string>;
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const createLocalStorage = (): LocalStorageStub => {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
};

const localStorageStub = createLocalStorage();

beforeEach(() => {
  localStorageStub.store.clear();
  // @ts-expect-error provide minimal window mock for missions module
  globalThis.window = {
    localStorage: {
      getItem: localStorageStub.getItem,
      setItem: localStorageStub.setItem,
      removeItem: localStorageStub.removeItem,
    },
  };
  resetMissionProgress();
});

describe('missions', () => {
  it('tracks mission progress and marks completion', () => {
    const initial = getMissionStates(new Date('2025-03-07T00:00:00Z'));
    expect(initial.find((mission) => mission.id === 'daily-no-hint-level')?.progress).toBe(0);

    incrementMission('daily-no-hint-level', 1, new Date('2025-03-07T05:00:00Z'));
    const updated = getMissionStates(new Date('2025-03-07T12:00:00Z'));
    const daily = updated.find((mission) => mission.id === 'daily-no-hint-level');
    expect(daily?.progress).toBe(1);
    expect(daily?.completed).toBe(true);
  });

  it('resets daily missions on the next day', () => {
    incrementMission('daily-no-hint-level', 1, new Date('2025-03-07T05:00:00Z'));
    const nextDay = getMissionStates(new Date('2025-03-08T01:00:00Z'));
    expect(nextDay.find((mission) => mission.id === 'daily-no-hint-level')?.progress).toBe(0);
  });

  it('keeps weekly progress within the same ISO week', () => {
    incrementMission('weekly-no-hint-levels', 1, new Date('2025-03-03T00:00:00Z'));
    incrementMission('weekly-no-hint-levels', 1, new Date('2025-03-05T00:00:00Z'));
    const midWeek = getMissionStates(new Date('2025-03-06T00:00:00Z'));
    expect(midWeek.find((mission) => mission.id === 'weekly-no-hint-levels')?.progress).toBe(2);
  });

  it('resets weekly missions when entering a new ISO week', () => {
    incrementMission('weekly-no-hint-levels', 3, new Date('2025-03-07T00:00:00Z'));
    const newWeek = getMissionStates(new Date('2025-03-10T00:00:00Z'));
    expect(newWeek.find((mission) => mission.id === 'weekly-no-hint-levels')?.progress).toBe(0);
  });
});
