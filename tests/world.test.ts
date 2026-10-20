import { describe, it, expect } from 'vitest';
import { createWorld, stepWorld, moveActor, findPath, validPoint, distance, ROCKS, BUSHES, verdict } from '../src/world';

function advance(w: ReturnType<typeof createWorld>, seconds: number, x = 0, y = 0) {
  for (let i = 0; i < seconds * 60; i++) stepWorld(w, x, y, 1 / 60);
}
describe('the meadow rules', () => {
  it('waits for the first movement before starting a round', () => {
    const w = createWorld(); advance(w, 5); expect(w.time).toBe(0); expect(w.phase).toBe('ready');
    stepWorld(w, 1, 0, 1 / 60); expect(w.phase).toBe('playing');
  });
  it('uses the same top speed diagonally', () => {
    const a = createWorld('stroll'), b = createWorld('stroll');
    advance(a, .5, 1, 0); advance(b, .5, 1, 1);
    expect(Math.hypot(a.lamb.vx, a.lamb.vy)).toBeCloseTo(Math.hypot(b.lamb.vx, b.lamb.vy), 4);
  });
  it('collects each flower once, and regrowth cannot appear beneath the lamb', () => {
    const w = createWorld('stroll'); w.phase = 'playing';
    const flower = w.flowers[0]; w.lamb.x = flower.x; w.lamb.y = flower.y;
    advance(w, 1); expect(w.score).toBe(1);
    advance(w, 40); expect(w.score).toBe(1); expect(flower.eaten).toBe(true);
  });
  it('freezes all rules while paused', () => {
    const w = createWorld(); advance(w, 2, 1, 0); w.phase = 'paused';
    const before = JSON.stringify({ time: w.time, lamb: w.lamb, dog: w.dog, flowers: w.flowers });
    advance(w, 10, 1, 1);
    expect(JSON.stringify({ time: w.time, lamb: w.lamb, dog: w.dog, flowers: w.flowers })).toBe(before);
  });
  it('keeps bodies out of rocks and inside the fence', () => {
    const w = createWorld(); const rock = ROCKS[0]; w.lamb.x = rock.x - 70; w.lamb.y = rock.y;
    for (let i = 0; i < 100; i++) moveActor(w.lamb, 235, 0, 1 / 60, 21);
    expect(distance(w.lamb, rock)).toBeGreaterThanOrEqual(rock.r + 21 - .001);
    moveActor(w.lamb, -100000, -100000, 1, 21); expect(w.lamb.x).toBe(111); expect(w.lamb.y).toBe(111);
  });
  it('routes around a rock without crossing its expanded collision area', () => {
    const rock = ROCKS[0], from = { x: rock.x - 160, y: rock.y }, to = { x: rock.x + 160, y: rock.y };
    const path = findPath(from, to);
    expect(path.length).toBeGreaterThan(1); expect(distance(path[path.length - 1], to)).toBeLessThan(1);
    for (const p of path) expect(validPoint(p, 25)).toBe(true);
  });
  it('hides a still lamb in bushes without tracking its concealed position', () => {
    const w = createWorld(); w.phase = 'playing'; w.lamb.x = BUSHES[0].x; w.lamb.y = BUSHES[0].y;
    w.dog.x = 1600; w.dog.y = 1400; w.dog.state = 'search'; w.dog.timer = 20;
    w.dog.lastSeen = { x: 1200, y: 1000 };
    advance(w, .5); expect(w.hidden).toBe(true); expect(w.dog.lastSeen).toEqual({ x: 1200, y: 1000 });
  });
  it('gives capture precedence over a same-step flower', () => {
    const w = createWorld(); w.phase = 'playing';
    const f = w.flowers[0]; w.lamb.x = f.x; w.lamb.y = f.y; w.dog.x = f.x; w.dog.y = f.y;
    w.dog.state = 'chase'; w.dog.timer = 4;
    stepWorld(w, 0, 0, 1 / 60); expect(w.phase).toBe('caught'); expect(w.score).toBe(0);
  });
  it('does not run the dog in gentle stroll mode', () => {
    const w = createWorld('stroll'); w.phase = 'playing'; advance(w, 120);
    expect(w.phase).toBe('playing'); expect(w.dog.state).toBe('arriving');
  });
  it('creates repeatable, valid flower placements', () => {
    const a = createWorld('classic', 97), b = createWorld('classic', 97);
    expect(a.flowers).toEqual(b.flowers); a.flowers.forEach(f => expect(validPoint(f)).toBe(true));
  });
  it('creates a clean new round after capture', () => {
    const a = createWorld(); a.score = 20; a.phase = 'caught'; a.hidden = true;
    const b = createWorld(); expect(b.score).toBe(0); expect(b.phase).toBe('ready'); expect(b.hidden).toBe(false);
  });
  it('earns progressively more scandalous verdicts', () => {
    expect(verdict(0)).toBe('Mostly innocent.'); expect(verdict(22)).toBe('Flower criminal.'); expect(verdict(70)).toBe('Absolute menace.');
  });
});
