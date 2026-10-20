import Phaser from 'phaser';
import { buildArt } from './art';
import { BUSHES, FIELD, ROCKS, clamp, createWorld, random, stepWorld, type Mode, type World } from './world';
import type { InputController } from './input';
import type { AudioGarden } from './audio';

export interface SceneHooks {
  ready: () => void;
  update: (world: World) => void;
  caught: (world: World) => void;
  toast: (text: string) => void;
}
export class MeadowScene extends Phaser.Scene {
  world = createWorld();
  menu = true;
  reducedMotion = false;
  inputController!: InputController;
  audio!: AudioGarden;
  hooks!: SceneHooks;
  lamb!: Phaser.GameObjects.Image;
  dog!: Phaser.GameObjects.Image;
  lambShadow!: Phaser.GameObjects.Image;
  dogShadow!: Phaser.GameObjects.Image;
  flowers: Phaser.GameObjects.Image[] = [];
  bushViews: Phaser.GameObjects.Image[] = [];
  butterfly!: Phaser.GameObjects.Image;
  dogLabel!: Phaser.GameObjects.Text;
  accumulator = 0;
  particles: { image: Phaser.GameObjects.Image; age: number; vx: number; vy: number; rotation: number }[] = [];
  caughtFired = false;
  lastFrame = 0;
  constructor() { super('meadow'); }
  create() {
    buildArt(this);
    this.buildMeadow();
    this.lambShadow = this.add.image(1100, 880, 'shadow').setDisplaySize(100, 36).setDepth(1);
    this.dogShadow = this.add.image(1100, 1450, 'shadow').setDisplaySize(90, 32).setDepth(1);
    this.lamb = this.add.image(1100, 850, 'lamb-munch').setOrigin(.5, .75);
    this.dog = this.add.image(1100, 1450, 'dog').setOrigin(.5, .76);
    this.dogLabel = this.add.text(0, 0, '', { fontFamily: 'Georgia, serif', fontSize: '26px', color: '#405246', backgroundColor: '#fcf8e9', padding: { x: 10, y: 5 } }).setOrigin(.5, 1).setDepth(10000);
    this.butterfly = this.add.image(1200, 800, 'butterfly').setDisplaySize(32, 27).setDepth(3000);
    this.cameras.main.setBackgroundColor('#dce6b9');
    this.scale.on('resize', () => this.layout(true));
    this.layout(true); this.hooks.ready();
  }
  buildMeadow() {
    this.add.tileSprite(FIELD.w / 2, FIELD.h / 2, 4000, 3500, 'grass').setDepth(-100);
    const g = this.add.graphics().setDepth(-90);
    // Quiet, rounded patches create a landscape without visually competing with the lamb.
    g.fillStyle(0xc5d699, .3);
    for (const b of BUSHES) g.fillEllipse(b.x, b.y + 10, b.r * 4.5, b.r * 2.7);
    g.fillStyle(0xf3e7bf, .35);
    g.fillEllipse(1070, 870, 450, 250);
    g.lineStyle(58, 0xe6dfb4, .48);
    g.beginPath(); g.moveTo(100, 1000);
    for (let x = 100; x <= 2100; x += 25) g.lineTo(x, 900 + Math.sin(x / 300) * 170);
    g.strokePath();
    g.lineStyle(2, 0xc5c598, .2);
    g.strokeEllipse(1070, 870, 450, 250);
    const rng = random(19);
    for (let i = 0; i < 130; i++) {
      const x = 130 + rng() * 1940, y = 130 + rng() * 1440;
      g.fillStyle(i % 3 ? 0xb1c483 : 0xeef0c9, .45); g.fillEllipse(x, y, 10 + rng() * 18, 4 + rng() * 8);
    }
    // Split-rail fence establishes the bounds without a harsh rectangle.
    const fence = this.add.graphics().setDepth(3);
    const rail = (ax: number, ay: number, bx: number, by: number) => {
      fence.lineStyle(7, 0xb7b08a, 1); fence.lineBetween(ax, ay - 14, bx, by - 14);
      fence.lineStyle(5, 0xe5ddba, 1); fence.lineBetween(ax, ay - 17, bx, by - 17);
      fence.lineStyle(6, 0xb7b08a, 1); fence.lineBetween(ax, ay - 29, bx, by - 29);
      fence.lineStyle(4, 0xe5ddba, 1); fence.lineBetween(ax, ay - 32, bx, by - 32);
    };
    rail(90, 90, 2110, 90); rail(90, 1610, 2110, 1610); rail(90, 90, 90, 1610); rail(2110, 90, 2110, 1610);
    const post = (x: number, y: number) => {
      fence.fillStyle(0x76845e, .14); fence.fillEllipse(x + 4, y + 3, 25, 10);
      fence.fillStyle(0xc3b994, 1); fence.fillRoundedRect(x - 6, y - 46, 13, 50, 3);
      fence.fillStyle(0xe9e0bc, 1); fence.fillRoundedRect(x - 6, y - 46, 6, 48, 3);
    };
    for (let x = 90; x <= 2110; x += 101) { post(x, 90); post(x, 1610); }
    for (let y = 90; y <= 1610; y += 95) { post(90, y); post(2110, y); }
    for (const r of ROCKS) this.add.image(r.x, r.y, 'rock').setDisplaySize(r.r * 2.7, r.r * 2.4).setOrigin(.5, .7).setDepth(r.y);
    this.bushViews = BUSHES.map(b => this.add.image(b.x, b.y, 'bush').setDisplaySize(b.r * 2.6, b.r * 2).setOrigin(.5, .72).setDepth(b.y + 8));
    this.flowers = this.world.flowers.map(f => this.add.image(f.x, f.y, `flower-${f.kind}`).setDisplaySize(42, 47).setOrigin(.5, .8).setDepth(f.y - 10));
    const sign = this.add.graphics().setDepth(600);
    sign.fillStyle(0xb8ac84); sign.fillRoundedRect(197, 545, 10, 70, 3);
    sign.fillStyle(0xf5e7bd); sign.fillRoundedRect(148, 520, 110, 48, 6);
    this.add.text(203, 542, 'NO NIBBLING', { fontFamily: 'Georgia', fontSize: '13px', color: '#6d7350' }).setOrigin(.5).setDepth(601).setRotation(-.04);
  }
  startRound(mode: Mode) {
    this.world = createWorld(mode, Math.floor(Math.random() * 1000000));
    this.menu = false; this.caughtFired = false; this.accumulator = 0; this.inputController.clear();
    this.flowers.forEach((v, i) => { const f = this.world.flowers[i]; v.setPosition(f.x, f.y).setTexture(`flower-${f.kind}`).setDepth(f.y - 10).setVisible(true); });
    this.clearParticles(); this.layout(true); this.inputController.enabled = true;
  }
  showMenu() {
    this.menu = true; this.inputController.enabled = false; this.inputController.clear(); this.clearParticles();
    this.world.lamb.x = 1100; this.world.lamb.y = 850; this.layout(true);
  }
  pause() { this.inputController.enabled = false; this.inputController.clear(); if (this.world.phase === 'playing' || this.world.phase === 'ready') this.world.phase = 'paused'; this.accumulator = 0; }
  resume() { this.world.phase = this.world.time === 0 ? 'ready' : 'playing'; this.inputController.clear(); this.inputController.enabled = true; this.accumulator = 0; }
  layout(snap = false) {
    const c = this.cameras.main, w = this.scale.width, h = this.scale.height;
    if (!this.lamb) return;
    const short = Math.min(w, h), target = clamp(short * .15, 49, 100);
    const zoom = this.menu ? (w < 700 ? .75 : .85) : target / 80;
    c.setZoom(zoom);
    if (this.menu) {
      const sx = w < 700 ? w * .5 : w * .72, sy = w < 700 ? h * .48 : h * .52;
      c.centerOn(1100 - (sx - w / 2) / zoom, 850 - (sy - h / 2) / zoom);
    } else if (snap) c.centerOn(this.world.lamb.x, this.world.lamb.y + h * .07 / zoom);
  }
  clearParticles() { this.particles.forEach(p => p.image.destroy()); this.particles = []; }
  burst(x: number, y: number, leaf = false) {
    const count = this.reducedMotion ? 3 : 8;
    for (let i = 0; i < count && this.particles.length < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const image = this.add.image(x, y - 15, leaf ? 'leaf' : 'petal').setDisplaySize(9, 10).setDepth(5000);
      this.particles.push({ image, age: 0, vx: Math.cos(angle) * 85, vy: Math.sin(angle) * 60 - 45, rotation: Math.random() * 4 - 2 });
    }
  }
  update(time: number, delta: number) {
    if (!this.lamb) return;
    const dt = Math.min(delta / 1000, .05), w = this.world;
    if (!this.menu && (w.phase === 'playing' || w.phase === 'ready')) {
      this.accumulator = Math.min(this.accumulator + dt, 5 / 60);
      const input = this.inputController.read();
      while (this.accumulator >= 1 / 60) {
        stepWorld(w, input.x, input.y, 1 / 60); this.accumulator -= 1 / 60;
        for (const event of w.events) {
          if (event.type === 'flower') { this.burst(event.x, event.y); this.audio.munch(w.score); }
          if (event.type === 'alert') this.audio.bark();
          if (event.type === 'hidden') { this.burst(event.x, event.y, true); this.audio.hide(); this.hooks.toast('Just a very ordinary bush.'); }
          if (event.type === 'found') this.hooks.toast('He’s onto you. Time to go!');
          if (event.type === 'caught' && !this.caughtFired) {
            this.caughtFired = true; this.inputController.enabled = false; this.inputController.clear(); this.audio.caught(); this.hooks.caught(w);
          }
        }
      }
      this.flowers.forEach((view, i) => view.setVisible(!w.flowers[i].eaten));
    }
    const running = !this.menu && w.phase === 'playing';
    const moving = running && Math.hypot(w.lamb.vx, w.lamb.vy) > 15;
    const animTime = w.phase === 'paused' ? this.lastFrame : time; this.lastFrame = animTime;
    const bob = this.reducedMotion ? 0 : moving ? Math.sin(w.time * 19) * 3 : Math.sin(animTime / 700) * 1.8;
    const base = this.menu ? (this.scale.width < 700 ? .8 : 1.15) : .295;
    this.lamb.setPosition(w.lamb.x, w.lamb.y + bob).setDepth(w.lamb.y + 20);
    this.lamb.setScale(base * (1 + (moving && !this.reducedMotion ? Math.sin(w.time * 19) * .025 : 0)), base);
    this.lamb.setRotation(moving && !this.reducedMotion ? Math.sin(w.time * 9.5) * .045 : this.menu ? -.04 : 0);
    this.lamb.setTexture(this.menu ? 'lamb-munch' : w.phase === 'caught' ? 'lamb-caught' : w.hidden ? 'lamb-hide' : w.munch > 0 ? 'lamb-munch' : 'lamb-normal');
    this.lamb.setFlipX(!this.menu && w.lamb.facing < 0).setAlpha(w.hidden ? .78 : 1);
    this.lambShadow.setPosition(w.lamb.x, w.lamb.y + (this.menu ? 45 : 12)).setDisplaySize(this.menu ? base * 260 : 95, this.menu ? base * 75 : 30);
    const showDog = !this.menu && w.mode === 'classic' && w.dog.state !== 'arriving';
    this.dog.setVisible(showDog).setPosition(w.dog.x, w.dog.y + (this.reducedMotion || w.phase === 'paused' ? 0 : Math.sin(w.time * 17) * (Math.hypot(w.dog.vx, w.dog.vy) > 10 ? 2.5 : 0))).setDepth(w.dog.y + 18).setScale(.32).setFlipX(w.dog.facing < 0);
    this.dogShadow.setVisible(showDog).setPosition(w.dog.x, w.dog.y + 12);
    const label = w.dog.state === 'alert' ? '!' : w.dog.state === 'search' ? '?' : w.dog.state === 'recover' ? '…' : '';
    this.dogLabel.setText(label).setVisible(showDog && !!label).setPosition(w.dog.x, w.dog.y - 83);
    this.bushViews.forEach((b, i) => b.setAlpha(!this.menu && Math.hypot(w.lamb.x - BUSHES[i].x, w.lamb.y - BUSHES[i].y) < BUSHES[i].r + 35 ? .48 : 1));
    this.butterfly.setPosition(1100 + Math.sin(time / 2500) * 150, 730 + Math.cos(time / 2100) * 40).setScale(.45, this.reducedMotion ? .4 : .3 + Math.abs(Math.sin(time / 110)) * .2);
    if (!this.menu && w.phase !== 'paused') {
      const c = this.cameras.main, lookX = w.lamb.vx * .12, lookY = w.lamb.vy * .1;
      const targetX = w.lamb.x + lookX - c.width / 2;
      const targetY = w.lamb.y + lookY + c.height * .07 / c.zoom - c.height / 2;
      const lerp = this.reducedMotion ? 1 : 1 - Math.exp(-7 * dt);
      c.scrollX += (targetX - c.scrollX) * lerp; c.scrollY += (targetY - c.scrollY) * lerp;
    }
    if (w.phase !== 'paused') {
      this.particles = this.particles.filter(p => {
        p.age += dt; if (p.age > .7) { p.image.destroy(); return false; }
        p.image.x += p.vx * dt; p.image.y += p.vy * dt; p.vy += 100 * dt; p.image.rotation += p.rotation * dt;
        p.image.setAlpha(1 - p.age / .7); return true;
      });
    }
    if (!this.menu) this.hooks.update(w);
  }
  dogScreenPosition() {
    const c = this.cameras.main;
    // Phaser camera zoom is around its midpoint.
    return { x: (this.world.dog.x - c.scrollX - c.width / 2) * c.zoom + c.width / 2,
      y: (this.world.dog.y - c.scrollY - c.height / 2) * c.zoom + c.height / 2 };
  }
}
