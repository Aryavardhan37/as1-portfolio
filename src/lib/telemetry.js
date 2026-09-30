// Tiny pub/sub store. The ChipEngine writes to it every frame;
// HUD / nav / loader read from it without re-rendering React per frame.
const state = { e: 0, rot: 0, scroll: 0, active: 0, ready: false };
const listeners = new Set();

export const telemetry = {
  get: () => state,
  emit(patch) {
    Object.assign(state, patch);
    listeners.forEach((fn) => fn(state));
  },
  subscribe(fn) {
    listeners.add(fn);
    fn(state);
    return () => listeners.delete(fn);
  },
};
