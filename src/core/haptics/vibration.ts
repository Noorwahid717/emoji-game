export const triggerVibration = (pattern: number | number[]): void => {
  if (typeof navigator === 'undefined') {
    return;
  }

  const vibrate = navigator.vibrate ?? (navigator as unknown as { webkitVibrate?: typeof navigator.vibrate }).webkitVibrate;
  if (typeof vibrate !== 'function') {
    return;
  }

  try {
    vibrate.call(navigator, pattern);
  } catch (error) {
    console.warn('Unable to trigger vibration', error);
  }
};

export default {
  triggerVibration,
};
