import { getDailySeed } from '../random/seededRandom';

type MissionType = 'daily' | 'weekly';

export interface MissionDefinition {
  readonly id: string;
  readonly type: MissionType;
  readonly descriptionKey: string;
  readonly goal: number;
}

export interface MissionState extends MissionDefinition {
  readonly progress: number;
  readonly completed: boolean;
}

const STORAGE_KEY = 'emoji-game::missions';

interface StoredMission {
  value: number;
  updatedAt: string;
}

interface MissionStoragePayload {
  progress: Record<string, StoredMission>;
  dailyStamp: string;
  weeklyStamp: string;
}

const missionDefinitions: MissionDefinition[] = [
  {
    id: 'daily-no-hint-level',
    type: 'daily',
    descriptionKey: 'missions.daily.noHintLevel',
    goal: 1,
  },
  {
    id: 'daily-streak',
    type: 'daily',
    descriptionKey: 'missions.daily.streak',
    goal: 1,
  },
  {
    id: 'weekly-no-hint-levels',
    type: 'weekly',
    descriptionKey: 'missions.weekly.noHintLevels',
    goal: 3,
  },
];

const defaultPayload = (): MissionStoragePayload => ({
  progress: {},
  dailyStamp: '',
  weeklyStamp: '',
});

const getWeeklyStamp = (date: Date): string => {
  const temp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((temp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${temp.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
};

const readStorage = (): MissionStoragePayload => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultPayload();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultPayload();
    }

    const parsed = JSON.parse(raw) as Partial<MissionStoragePayload>;
    return {
      progress: parsed.progress ?? {},
      dailyStamp: parsed.dailyStamp ?? '',
      weeklyStamp: parsed.weeklyStamp ?? '',
    };
  } catch (error) {
    console.warn('Unable to parse mission storage payload', error);
    return defaultPayload();
  }
};

const writeStorage = (payload: MissionStoragePayload): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Unable to persist missions', error);
  }
};

const ensureFresh = (payload: MissionStoragePayload, now: Date): MissionStoragePayload => {
  const dailySeed = getDailySeed(now);
  const weeklySeed = getWeeklyStamp(now);

  if (payload.dailyStamp !== dailySeed) {
    missionDefinitions
      .filter((mission) => mission.type === 'daily')
      .forEach((mission) => {
        delete payload.progress[mission.id];
      });
    payload.dailyStamp = dailySeed;
  }

  if (payload.weeklyStamp !== weeklySeed) {
    missionDefinitions
      .filter((mission) => mission.type === 'weekly')
      .forEach((mission) => {
        delete payload.progress[mission.id];
      });
    payload.weeklyStamp = weeklySeed;
  }

  return payload;
};

const toMissionState = (
  definition: MissionDefinition,
  stored: StoredMission | undefined,
): MissionState => {
  const progress = stored?.value ?? 0;
  return {
    ...definition,
    progress,
    completed: progress >= definition.goal,
  };
};

export const getMissionStates = (now: Date = new Date()): MissionState[] => {
  const payload = ensureFresh(readStorage(), now);
  return missionDefinitions.map((definition) =>
    toMissionState(definition, payload.progress[definition.id]),
  );
};

export const incrementMission = (
  missionId: string,
  amount = 1,
  now: Date = new Date(),
): MissionState[] => {
  const payload = ensureFresh(readStorage(), now);
  const definition = missionDefinitions.find((mission) => mission.id === missionId);
  if (!definition) {
    return missionDefinitions.map((mission) => toMissionState(mission, payload.progress[mission.id]));
  }

  const stored = payload.progress[missionId] ?? { value: 0, updatedAt: '' };
  const newValue = Math.min(definition.goal, stored.value + amount);
  payload.progress[missionId] = {
    value: newValue,
    updatedAt: now.toISOString(),
  };
  writeStorage(payload);

  return missionDefinitions.map((mission) => toMissionState(mission, payload.progress[mission.id]));
};

export const resetMissionProgress = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to reset missions', error);
  }
};

export const getMissionDefinitions = (): MissionDefinition[] => [...missionDefinitions];

export default {
  getMissionStates,
  incrementMission,
  getMissionDefinitions,
  resetMissionProgress,
};
