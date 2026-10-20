export type Mode = 'classic' | 'stroll';
export type Phase = 'ready' | 'playing' | 'paused' | 'caught';
export type DogState = 'arriving' | 'patrol' | 'alert' | 'chase' | 'search' | 'recover' | 'celebrate';
export interface Point { x: number; y: number }
export interface Circle extends Point { r: number }
export interface Flower extends Point { id: number; kind: number; eaten: boolean; regrow: number }
export interface Actor extends Point { vx: number; vy: number; facing: number }
export interface World {
  mode: Mode; phase: Phase; time: number; score: number; seed: number;
  lamb: Actor; dog: Actor & { state: DogState; timer: number; lastSeen: Point; path: Point[]; replan: number };
  hidden: boolean; hideTime: number; sniff: number; flowers: Flower[];
  events: { type: 'flower' | 'alert' | 'hidden' | 'found' | 'caught'; x: number; y: number; kind?: number }[];
  rng: () => number; munch: number; burst: boolean; discovered: number;
}
export const FIELD = { w: 2200, h: 1700, inset: 90 };
export const ROCKS: Circle[] = [
  { x: 690, y: 620, r: 42 }, { x: 1440, y: 600, r: 52 },
  { x: 1510, y: 1190, r: 45 }, { x: 680, y: 1220, r: 48 },
  { x: 1090, y: 350, r: 38 }, { x: 1820, y: 890, r: 43 },
  { x: 390, y: 900, r: 38 }
];
export const BUSHES: Circle[] = [
  { x: 880, y: 730, r: 72 }, { x: 1320, y: 1000, r: 75 },
  { x: 470, y: 440, r: 70 }, { x: 1710, y: 420, r: 77 },
  { x: 430, y: 1320, r: 72 }, { x: 1810, y: 1320, r: 72 },
  { x: 1120, y: 1400, r: 73 }
];
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
export function random(seed: number) {
  let n = seed >>> 0;
  return () => { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function actor(x: number, y: number): Actor { return { x, y, vx: 0, vy: 0, facing: 1 }; }
export function validPoint(p: Point, radius = 25) {
  return p.x > FIELD.inset + radius && p.x < FIELD.w - FIELD.inset - radius &&
    p.y > FIELD.inset + radius && p.y < FIELD.h - FIELD.inset - radius &&
    ROCKS.every(r => distance(p, r) > r.r + radius);
}
export function createWorld(mode: Mode = 'classic', seed = 42): World {
  const rng = random(seed);
  const flowers: Flower[] = [];
  // Authored first bites lead gently toward the first hiding bush.
  const first = [{ x: 1120, y: 770 }, { x: 1080, y: 710 }, { x: 1015, y: 700 }, { x: 960, y: 725 }];
  for (let i = 0; i < 95; i++) {
    let p = first[i] ?? { x: 0, y: 0 };
    if (i >= first.length) {
      do { p = { x: 160 + rng() * 1880, y: 160 + rng() * 1380 }; }
      while (!validPoint(p, 50) || BUSHES.some(b => distance(p, b) < b.r + 15));
    }
    flowers.push({ ...p, id: i, kind: i % 9 === 0 ? 2 : i % 3, eaten: false, regrow: 0 });
  }
  return {
    mode, phase: 'ready', time: 0, score: 0, seed, rng, flowers,
    lamb: actor(1100, 850),
    dog: { ...actor(1100, 1450), state: 'arriving', timer: 6, lastSeen: { x: 1100, y: 850 }, path: [], replan: 0 },
    hidden: false, hideTime: 0, sniff: 0, munch: 0, burst: false, discovered: 0, events: []
  };
}
export function moveActor(a: Actor, dx: number, dy: number, dt: number, radius: number) {
  a.x = clamp(a.x + dx * dt, FIELD.inset + radius, FIELD.w - FIELD.inset - radius);
  a.y = clamp(a.y + dy * dt, FIELD.inset + radius, FIELD.h - FIELD.inset - radius);
  for (const rock of ROCKS) {
    const d = distance(a, rock), min = radius + rock.r;
    if (d < min) {
      const angle = d < 0.001 ? 0 : Math.atan2(a.y - rock.y, a.x - rock.x);
      a.x = rock.x + Math.cos(angle) * min; a.y = rock.y + Math.sin(angle) * min;
    }
  }
}
function segmentClear(a: Point, b: Point, margin: number) {
  const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
  return ROCKS.every(r => {
    const t = length ? clamp(((r.x - a.x) * dx + (r.y - a.y) * dy) / length, 0, 1) : 0;
    return Math.hypot(a.x + dx * t - r.x, a.y + dy * t - r.y) > r.r + margin;
  });
}
const CELL = 55, COLS = Math.ceil(FIELD.w / CELL), ROWS = Math.ceil(FIELD.h / CELL);
export function findPath(start: Point, target: Point): Point[] {
  if (segmentClear(start, target, 26)) return [target];
  const key = (x: number, y: number) => y * COLS + x;
  const center = (k: number) => ({ x: (k % COLS + .5) * CELL, y: (Math.floor(k / COLS) + .5) * CELL });
  const from = key(Math.floor(start.x / CELL), Math.floor(start.y / CELL));
  const to = key(Math.floor(target.x / CELL), Math.floor(target.y / CELL));
  const open = [from], parents = new Map<number, number>(), costs = new Map([[from, 0]]), closed = new Set<number>();
  let closest = from, bestDistance = Infinity;
  for (let count = 0; open.length && count < 1600; count++) {
    open.sort((a, b) => (costs.get(a)! + distance(center(a), target)) - (costs.get(b)! + distance(center(b), target)));
    const current = open.shift()!;
    if (current === to) { closest = current; break; }
    closed.add(current);
    const d = distance(center(current), target);
    if (d < bestDistance) { bestDistance = d; closest = current; }
    const cx = current % COLS, cy = Math.floor(current / COLS);
    for (const [ox, oy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      const nx = cx + ox, ny = cy + oy, next = key(nx, ny), p = center(next);
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || closed.has(next) || !validPoint(p, 29) || !segmentClear(center(current), p, 27)) continue;
      const cost = costs.get(current)! + Math.hypot(ox, oy) * CELL;
      if (cost < (costs.get(next) ?? Infinity)) {
        costs.set(next, cost); parents.set(next, current);
        if (!open.includes(next)) open.push(next);
      }
    }
  }
  const path: Point[] = [];
  let k = closest;
  while (k !== from && parents.has(k)) { path.unshift(center(k)); k = parents.get(k)!; }
  if (path.length && segmentClear(path[path.length - 1], target, 26)) path.push(target);
  return path.length ? path : [start];
}
function changeDog(w: World, state: DogState, timer: number) {
  w.dog.state = state; w.dog.timer = timer; w.dog.path = []; w.dog.replan = 0;
  if (state === 'alert') w.events.push({ type: 'alert', x: w.dog.x, y: w.dog.y });
}
export function stepWorld(w: World, inputX: number, inputY: number, dt: number) {
  w.events = [];
  const inputLength = Math.hypot(inputX, inputY);
  if (w.phase === 'ready' && inputLength > .05) w.phase = 'playing';
  if (w.phase !== 'playing') return;
  dt = clamp(dt, 0, 1 / 30);
  w.time += dt; w.munch = Math.max(0, w.munch - dt); w.discovered = Math.max(0, w.discovered - dt);
  const mag = Math.max(1, inputLength), speed = 235;
  const blend = 1 - Math.exp(-18 * dt);
  w.lamb.vx += (inputX / mag * speed - w.lamb.vx) * blend;
  w.lamb.vy += (inputY / mag * speed - w.lamb.vy) * blend;
  if (Math.abs(w.lamb.vx) > 5) w.lamb.facing = Math.sign(w.lamb.vx);
  moveActor(w.lamb, w.lamb.vx, w.lamb.vy, dt, 21);
  const inBush = BUSHES.some(b => distance(w.lamb, b) < b.r * .75);
  const wasHidden = w.hidden;
  w.hideTime = inBush && Math.hypot(w.lamb.vx, w.lamb.vy) < 95 ? w.hideTime + dt : 0;
  w.hidden = w.hideTime > .25 && w.discovered === 0;
  if (w.hidden && !wasHidden) w.events.push({ type: 'hidden', x: w.lamb.x, y: w.lamb.y });
  w.burst = false;
  if (w.mode === 'classic') {
    const dog = w.dog;
    dog.timer -= dt; dog.replan -= dt;
    const gap = distance(dog, w.lamb), visible = !w.hidden && gap < 620 && segmentClear(dog, w.lamb, 0);
    if (visible) dog.lastSeen = { x: w.lamb.x, y: w.lamb.y };
    const pressure = Math.min(w.time / 150, 1);
    if (dog.state === 'arriving' && dog.timer <= 0) changeDog(w, 'alert', 1.6);
    else if (dog.state === 'alert' && dog.timer <= 0) changeDog(w, 'chase', 5.5 + pressure * 2);
    else if (dog.state === 'chase') {
      if (!visible && (w.hidden || gap > 660)) changeDog(w, 'search', 4);
      else if (dog.timer <= 0) changeDog(w, 'recover', 2.2 - pressure * .7);
    } else if (dog.state === 'search') {
      if (visible) changeDog(w, 'alert', .8);
      else if (dog.timer <= 0) changeDog(w, 'patrol', 5);
    } else if (dog.state === 'recover' && dog.timer <= 0) changeDog(w, visible ? 'alert' : 'search', visible ? 1 : 4);
    else if (dog.state === 'patrol') {
      if (visible) changeDog(w, 'alert', 1.3);
      else if (dog.timer <= 0) {
        dog.lastSeen = { x: 300 + w.rng() * 1600, y: 300 + w.rng() * 1100 }; dog.timer = 5; dog.replan = 0;
      }
    }
    // A witnessed hiding spot is investigated; discovery is visibly telegraphed.
    if (w.hidden && gap < 150 && distance(w.lamb, dog.lastSeen) < 100 && dog.state === 'search') {
      w.sniff += dt;
      if (w.sniff > 2.5) {
        w.hidden = false; w.discovered = 2; w.sniff = 0;
        w.events.push({ type: 'found', x: w.lamb.x, y: w.lamb.y }); changeDog(w, 'alert', 1.1);
      }
    } else w.sniff = Math.max(0, w.sniff - dt * 2);
    let dogSpeed = 0;
    if (dog.state === 'chase') { w.burst = dog.timer > 3.4; dogSpeed = w.burst ? 258 + pressure * 26 : 175; }
    if (dog.state === 'search') dogSpeed = 130;
    if (dog.state === 'patrol') dogSpeed = 85;
    if (dogSpeed) {
      if (dog.replan <= 0) { dog.path = findPath(dog, dog.lastSeen); dog.replan = .28; }
      while (dog.path.length > 1 && distance(dog, dog.path[0]) < 30) dog.path.shift();
      const target = dog.path[0] ?? dog.lastSeen, d = distance(dog, target);
      dog.vx = d > 8 ? (target.x - dog.x) / d * dogSpeed : 0;
      dog.vy = d > 8 ? (target.y - dog.y) / d * dogSpeed : 0;
      if (Math.abs(dog.vx) > 5) dog.facing = Math.sign(dog.vx);
      moveActor(dog, dog.vx, dog.vy, dt, 24);
    } else { dog.vx = 0; dog.vy = 0; }
    if (distance(dog, w.lamb) < 38 && dog.state !== 'arriving' && dog.state !== 'recover' && dog.state !== 'alert') {
      w.phase = 'caught'; dog.state = 'celebrate'; w.events.push({ type: 'caught', x: w.lamb.x, y: w.lamb.y }); return;
    }
  }
  for (const flower of w.flowers) {
    if (!flower.eaten && distance(flower, w.lamb) < 33) {
      flower.eaten = true; flower.regrow = 20 + w.rng() * 12; w.score++; w.munch = .3;
      w.events.push({ type: 'flower', x: flower.x, y: flower.y, kind: flower.kind });
    } else if (flower.eaten) {
      flower.regrow -= dt;
      if (flower.regrow <= 0 && distance(flower, w.lamb) > 550) flower.eaten = false;
    }
  }
}
export function verdict(score: number) {
  return score >= 60 ? 'Absolute menace.' : score >= 35 ? 'Pasture outlaw.' : score >= 18 ? 'Flower criminal.' : score >= 7 ? 'A little suspicious.' : 'Mostly innocent.';
}
