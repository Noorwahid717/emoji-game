import { t } from '../../core/locale/Localization';

type RegionId = 'score' | 'timer';

const REGION_IDS: Record<RegionId, string> = {
  score: 'emoji-game-live-score',
  timer: 'emoji-game-live-timer',
};

const regions: Partial<Record<RegionId, HTMLElement>> = {};

const hiddenStyles: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  border: '0',
  padding: '0',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
};

const ensureContainer = (): HTMLElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  let container = document.getElementById('emoji-game-live');
  if (!container) {
    container = document.createElement('div');
    container.id = 'emoji-game-live';
    Object.assign(container.style, hiddenStyles);
    document.body.appendChild(container);
  }
  return container;
};

const ensureRegion = (id: RegionId): HTMLElement | null => {
  if (regions[id]) {
    return regions[id] ?? null;
  }

  const container = ensureContainer();
  if (!container) {
    return null;
  }

  const region = document.createElement('div');
  region.id = REGION_IDS[id];
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  Object.assign(region.style, hiddenStyles);
  container.appendChild(region);
  regions[id] = region;
  return region;
};

export const announceScore = (score: number): void => {
  const region = ensureRegion('score');
  if (region) {
    region.textContent = t('live.scoreUpdate', { score });
  }
};

export const announceTimer = (seconds: number): void => {
  const region = ensureRegion('timer');
  if (region) {
    region.textContent = t('live.timerUpdate', { seconds });
  }
};

export const resetLiveRegions = (): void => {
  (Object.keys(regions) as RegionId[]).forEach((key) => {
    const region = regions[key];
    if (region) {
      region.textContent = '';
    }
  });
};

export default {
  announceScore,
  announceTimer,
  resetLiveRegions,
};
