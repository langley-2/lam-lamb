import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadSave, writeSave } from '../src/storage';
afterEach(() => vi.unstubAllGlobals());
describe('local records', () => {
  it('survives unavailable storage', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
    expect(loadSave().best).toBe(0); expect(() => writeSave(loadSave())).not.toThrow();
  });
  it('rejects corrupt JSON and malformed score types', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{nope' }); expect(loadSave().best).toBe(0);
    vi.stubGlobal('localStorage', { getItem: () => '{"best":"900","strollBest":-2,"muted":"yes"}' });
    expect(loadSave()).toMatchObject({ best: 0, strollBest: 0, muted: false });
  });
});
