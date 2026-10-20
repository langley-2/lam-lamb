import Phaser from 'phaser';
import { random } from './world';
type C = CanvasRenderingContext2D;
function ellipse(c: C, x: number, y: number, rx: number, ry: number, fill: string, angle = 0, stroke?: string) {
  c.beginPath(); c.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); }
}
function line(c: C, points: number[], color: string, width = 2) {
  c.beginPath(); c.moveTo(points[0], points[1]); for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
}
export function makeTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: C) => void, scale = 2) {
  const canvas = document.createElement('canvas'); canvas.width = w * scale; canvas.height = h * scale;
  const c = canvas.getContext('2d')!; c.scale(scale, scale); draw(c); scene.textures.addCanvas(key, canvas);
}
export function lambDrawing(c: C, expression: 'normal' | 'munch' | 'caught' | 'hide' = 'normal') {
  // A woolly little body, deliberately drawn at generous resolution.
  const edge = '#d5d1bc', ink = '#3c413a';
  ellipse(c, 56, 153, 11, 22, ink, .1); ellipse(c, 121, 153, 11, 22, ink, -.1);
  ellipse(c, 65, 149, 6, 12, '#606454'); ellipse(c, 113, 149, 6, 12, '#606454');
  ellipse(c, 38, 104, 16, 12, '#faf6e6', -.5, edge);
  ellipse(c, 91, 97, 62, 58, '#f8f4e3', 0, edge);
  const wool = [[46, 70, 23], [67, 48, 26], [98, 44, 26], [128, 56, 25], [145, 83, 23], [145, 111, 22], [127, 136, 24], [96, 146, 24], [66, 139, 24], [43, 116, 23], [36, 93, 21]];
  for (const [x, y, r] of wool) ellipse(c, x, y, r, r * .95, '#fcf8e9', 0, edge);
  ellipse(c, 91, 91, 51, 47, '#fcf8e9');
  // Wool curls use open strokes, keeping the face visually dominant.
  c.strokeStyle = '#e6e1cf'; c.lineWidth = 2; c.lineCap = 'round';
  for (const [x, y] of [[48, 78], [66, 57], [116, 58], [144, 102], [119, 132], [62, 121]]) {
    c.beginPath(); c.arc(x, y, 6, .1, Math.PI * 1.15); c.stroke();
  }
  ellipse(c, 62, 96, 23, 10, ink, .4); ellipse(c, 128, 94, 23, 10, ink, -.4);
  ellipse(c, 58, 96, 12, 4, '#b9a394', .4); ellipse(c, 132, 94, 12, 4, '#b9a394', -.4);
  ellipse(c, 96, 113, 32, 37, ink, -.05);
  ellipse(c, 97, 126, 23, 22, '#454b40');
  ellipse(c, 82, 81, 15, 12, '#fcf8e9', 0, edge);
  ellipse(c, 102, 78, 16, 13, '#fcf8e9', 0, edge);
  ellipse(c, 117, 84, 12, 10, '#fcf8e9', 0, edge);
  if (expression === 'hide') {
    line(c, [77, 109, 88, 109], '#fbf6df', 3); line(c, [104, 109, 115, 109], '#fbf6df', 3);
    ellipse(c, 86, 109, 2, 3, '#292d28'); ellipse(c, 112, 109, 2, 3, '#292d28');
  } else {
    ellipse(c, 82, 108, 8, expression === 'caught' ? 10 : 9, '#fffbea');
    ellipse(c, 110, 106, 8, expression === 'caught' ? 10 : 9, '#fffbea');
    ellipse(c, 84, 110, 3.7, 5, '#242b28'); ellipse(c, 111, 108, 3.7, 5, '#242b28');
    ellipse(c, 85, 108, 1.3, 1.5, 'white'); ellipse(c, 112, 106, 1.3, 1.5, 'white');
  }
  ellipse(c, 97, 127, 4, 2.5, '#252d28');
  if (expression === 'caught') ellipse(c, 98, 139, 4, 5, '#242b28');
  else {
    c.beginPath(); c.moveTo(97, 129); c.quadraticCurveTo(98, 139, 106, 133); c.strokeStyle = '#242b28'; c.lineWidth = 2; c.stroke();
  }
  if (expression === 'munch') {
    line(c, [103, 134, 128, 130], '#668c43', 2.5);
    ellipse(c, 118, 131, 7, 3, '#85a45b', -.5);
    for (let i = 0; i < 5; i++) ellipse(c, 133 + Math.cos(i * 1.26) * 6, 128 + Math.sin(i * 1.26) * 6, 5, 5, '#e8a6ac');
    ellipse(c, 133, 128, 3, 3, '#eacb69');
  }
}
function dogDrawing(c: C) {
  const dark = '#3c4946', light = '#faf3e1';
  ellipse(c, 48, 135, 10, 25, dark, -.15); ellipse(c, 108, 135, 10, 25, dark, .15);
  ellipse(c, 45, 153, 12, 8, light); ellipse(c, 111, 153, 12, 8, light);
  c.beginPath(); c.moveTo(119, 93); c.quadraticCurveTo(168, 65, 145, 43); c.quadraticCurveTo(140, 79, 109, 71); c.fillStyle = dark; c.fill();
  ellipse(c, 80, 94, 43, 48, dark);
  ellipse(c, 81, 108, 24, 36, light, .05);
  // Rounded triangular ears.
  c.fillStyle = dark; c.beginPath(); c.moveTo(41, 67); c.quadraticCurveTo(22, 10, 51, 20); c.lineTo(68, 45); c.fill();
  c.beginPath(); c.moveTo(95, 45); c.quadraticCurveTo(125, 2, 128, 28); c.lineTo(119, 75); c.fill();
  ellipse(c, 82, 66, 43, 35, dark);
  c.fillStyle = light; c.beginPath(); c.moveTo(78, 32); c.quadraticCurveTo(68, 53, 71, 79); c.lineTo(98, 81); c.quadraticCurveTo(85, 50, 88, 33); c.fill();
  ellipse(c, 64, 66, 7, 8, '#fffbea'); ellipse(c, 103, 65, 7, 8, '#fffbea');
  ellipse(c, 65, 68, 3, 4, '#202e2b'); ellipse(c, 102, 67, 3, 4, '#202e2b');
  ellipse(c, 83, 84, 25, 16, light);
  ellipse(c, 83, 79, 9, 6, '#263b37');
  line(c, [83, 84, 83, 91, 94, 89], dark, 2);
  ellipse(c, 88, 96, 6, 8, '#d69b96');
  line(c, [47, 103, 66, 112, 96, 111, 114, 101], '#c78968', 5);
  ellipse(c, 84, 115, 5, 6, '#dbb562');
}
export function buildArt(scene: Phaser.Scene) {
  for (const expression of ['normal', 'munch', 'caught', 'hide'] as const)
    makeTexture(scene, `lamb-${expression}`, 185, 185, c => lambDrawing(c, expression));
  makeTexture(scene, 'dog', 170, 170, dogDrawing);
  makeTexture(scene, 'shadow', 160, 60, c => {
    const g = c.createRadialGradient(80, 30, 5, 80, 30, 78); g.addColorStop(0, '#40513430'); g.addColorStop(1, '#40513400');
    ellipse(c, 80, 30, 80, 30, g as unknown as string);
  });
  makeTexture(scene, 'grass', 256, 256, c => {
    c.fillStyle = '#dce6b9'; c.fillRect(0, 0, 256, 256);
    const rng = random(71);
    for (let i = 0; i < 100; i++) {
      const x = rng() * 256, y = rng() * 256;
      ellipse(c, x, y, 1 + rng() * 3, 1 + rng() * 2, i % 3 ? '#9fb47918' : '#fff9d52b');
    }
    for (let i = 0; i < 10; i++) {
      const x = rng() * 246 + 5, y = rng() * 246 + 5;
      line(c, [x - 4, y - 4, x, y, x + 3, y - 6], '#93ab6c45', 1.3);
    }
  }, 1);
  makeTexture(scene, 'bush', 210, 160, c => {
    ellipse(c, 105, 132, 89, 20, '#68874722');
    const parts = [[44, 99, 36], [65, 62, 37], [109, 52, 40], [151, 73, 37], [171, 104, 29], [125, 104, 45], [79, 111, 43]];
    parts.forEach(([x, y, r], i) => ellipse(c, x, y, r, r * .8, ['#8fa76c', '#9cb877', '#a5bd7b', '#94ad6c'][i % 4], 0, '#839e63'));
    const rng = random(44);
    for (let i = 0; i < 35; i++) {
      const x = 40 + rng() * 126, y = 40 + rng() * 82;
      ellipse(c, x, y, 5, 2.5, i % 2 ? '#bad08e' : '#78935b', rng() * 3);
    }
    for (const [x, y] of [[65, 66], [130, 83], [98, 117], [155, 103]]) {
      ellipse(c, x, y, 3, 3, '#f8e4b6'); ellipse(c, x + 4, y + 2, 2, 2, '#e9c391');
    }
  });
  makeTexture(scene, 'rock', 130, 115, c => {
    ellipse(c, 67, 93, 56, 15, '#66764b20');
    c.beginPath(); c.moveTo(15, 82); c.lineTo(27, 42); c.quadraticCurveTo(41, 13, 74, 21); c.lineTo(103, 42); c.lineTo(117, 82); c.quadraticCurveTo(67, 108, 15, 82);
    c.fillStyle = '#bbc0a6'; c.fill(); c.strokeStyle = '#a4ad92'; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.moveTo(27, 42); c.lineTo(74, 21); c.lineTo(65, 57); c.lineTo(15, 82); c.fillStyle = '#d1d1b8'; c.fill();
    line(c, [65, 57, 100, 69], '#9da98e', 1.7);
    ellipse(c, 88, 84, 18, 6, '#92a56b', -.2); ellipse(c, 36, 82, 12, 4, '#9caf72');
  });
  for (let kind = 0; kind < 3; kind++) makeTexture(scene, `flower-${kind}`, 58, 65, c => {
    line(c, [29, 53, 27, 28], '#7b985a', 2.4);
    ellipse(c, 21, 43, 9, 3.5, '#8faa65', .5); ellipse(c, 35, 38, 8, 3.2, '#9eb878', -.6);
    const colors = ['#f8f0d8', '#dda3ad', '#e9c86c'];
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      ellipse(c, 28 + Math.cos(a) * 10, 24 + Math.sin(a) * 10, 7.5, 6, colors[kind], a);
    }
    ellipse(c, 28, 24, 5, 5, kind === 2 ? '#bd9450' : '#dbb658');
    ellipse(c, 26, 22, 1.5, 1.5, '#fff0ac');
  });
  makeTexture(scene, 'petal', 12, 14, c => ellipse(c, 6, 7, 5, 6, '#f6d4d4'));
  makeTexture(scene, 'leaf', 16, 12, c => ellipse(c, 8, 6, 7, 4, '#8ea969', -.4));
  makeTexture(scene, 'butterfly', 36, 30, c => {
    ellipse(c, 11, 10, 9, 8, '#e4b16d', .4); ellipse(c, 25, 10, 9, 8, '#e4b16d', -.4);
    ellipse(c, 12, 20, 6, 6, '#eaca8a'); ellipse(c, 24, 20, 6, 6, '#eaca8a');
    line(c, [18, 7, 18, 23], '#897951', 2);
  });
}
