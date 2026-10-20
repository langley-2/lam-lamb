export interface Save { version: 1; best: number; strollBest: number; muted: boolean; reducedMotion: boolean; }
export function loadSave(): Save {
  const defaults: Save = { version: 1, best: 0, strollBest: 0, muted: false, reducedMotion: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false };
  try {
    const data = JSON.parse(localStorage.getItem('lamb-on-the-lam:v1') ?? '{}');
    return { version: 1, best: Number.isFinite(data.best) ? Math.max(0, data.best) : 0,
      strollBest: Number.isFinite(data.strollBest) ? Math.max(0, data.strollBest) : 0,
      muted: typeof data.muted === 'boolean' ? data.muted : false,
      reducedMotion: typeof data.reducedMotion === 'boolean' ? data.reducedMotion : defaults.reducedMotion };
  } catch { return defaults; }
}
export function writeSave(save: Save) { try { localStorage.setItem('lamb-on-the-lam:v1', JSON.stringify(save)); } catch { /* The meadow still works if storage is unavailable. */ } }
