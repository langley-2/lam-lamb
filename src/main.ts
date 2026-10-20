import Phaser from 'phaser';
import { MeadowScene } from './scene';
import { InputController } from './input';
import { AudioGarden } from './audio';
import { loadSave, writeSave } from './storage';
import { clamp, distance, verdict, type Mode, type World } from './world';
import './style.css';

const ui = document.querySelector<HTMLElement>('#ui')!;
const root = document.querySelector<HTMLElement>('#game')!;
const save = loadSave();
const audio = new AudioGarden(); audio.muted = save.muted;
const scene = new MeadowScene(); scene.audio = audio; scene.reducedMotion = save.reducedMotion;
let screen: 'loading' | 'menu' | 'playing' | 'paused' | 'results' | 'help' | 'settings' = 'loading';
let previousScreen: 'menu' | 'paused' = 'menu';
let lastScore = -1, lastSecond = -1, toastTimer = 0, roundTimer: ReturnType<typeof setTimeout> | undefined;
let result: { score: number; time: number; mode: Mode; newBest: boolean } | null = null;
let modalFocus: HTMLElement | null = null;
const icon = {
  flower: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 13v9m0-4-5-3m5 1 5-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12 4c-5-6-9 2-5 4-5 4 3 8 5 4 2 4 10 0 5-4 4-2 0-10-5-4Z" fill="currentColor"/><circle cx="12" cy="8" r="2" fill="#f8ebc7"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m11 5-5 4H3v6h3l5 4V5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m11 5-5 4H3v6h3l5 4V5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m16 9 5 6m0-6-5 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 6v12M16 6v12" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3H9Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 3C9 1 2 7 5 15s17 3 15-12Z" fill="currentColor"/><path d="m3 22 12-13" stroke="#fcf8e9" stroke-width="1.6"/></svg>',
};
function soundButton() { return `<button class="icon-button sound-button" data-action="sound" aria-label="${save.muted ? 'Turn sound on' : 'Mute sound'}" aria-pressed="${!save.muted}">${save.muted ? icon.mute : icon.sound}</button>`; }
function header() { return `<header class="site-header"><span class="wordmark">${icon.flower}<span>A LITTLE MEADOW MISCHIEF</span></span><div class="header-actions">${soundButton()}<button class="icon-button" data-action="settings" aria-label="Settings">${icon.gear}</button></div></header>`; }
function renderMenu() {
  screen = 'menu'; clearTimeout(roundTimer); scene.showMenu(); document.body.dataset.screen = screen;
  ui.innerHTML = `${header()}
    <section class="intro" aria-labelledby="game-title">
      <div class="eyebrow"><span></span> SMALL LAMB. BIG PLANS.</div>
      <h1 id="game-title">Lamb<br><span>on the <em>Lam.</em></span></h1>
      <p class="intro-copy">The flowers are forbidden.<br>The lamb has other ideas.</p>
      <div class="menu-play">
        <button class="primary play-button" data-action="play">Let’s cause trouble ${icon.arrow}</button>
        <button class="text-button stroll-button" data-action="stroll">${icon.leaf} Just a gentle stroll</button>
        <p class="play-note"><span class="touch-copy">ONE THUMB</span><span class="keyboard-copy">ARROWS OR WASD</span><i>✦</i> ENDLESS MISCHIEF</p>
      </div>
    </section>
    <div class="hero-caption"><svg class="caption-arrow" viewBox="0 0 50 60" fill="none" aria-hidden="true"><path d="M43 54C17 50 10 31 16 9m-9 8 9-9 6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Looks innocent.<br>Absolutely isn’t.</div>
    <div class="meadow-label"><span class="tiny-star">✳</span> THE CLOVER PATCH <span>Population: one troublemaker</span></div>
    <footer class="menu-footer"><button class="text-button how-button" data-action="help"><span class="question">?</span> How to play</button><span class="personal-best">${icon.flower} PERSONAL BEST <b>${save.best}</b></span><span class="made-note">A small game. A softer afternoon.</span></footer>`;
}
function renderPlay() {
  screen = 'playing'; document.body.dataset.screen = screen; lastScore = -1; lastSecond = -1;
  ui.innerHTML = `<div class="hud"><div class="score-pill">${icon.flower}<strong id="score">0</strong><span>flowers<br><small id="best-label">best ${scene.world.mode === 'stroll' ? save.strollBest : save.best}</small></span></div><div class="hud-actions">${soundButton()}<button class="icon-button" data-action="pause" aria-label="Pause game">${icon.pause}</button></div></div>
    <div class="run-label">${scene.world.mode === 'stroll' ? 'A GENTLE STROLL' : 'THE GREAT LITTLE ESCAPE'}<span id="timer">0:00</span></div>
    <div id="start-hint" class="start-hint"><span class="hint-dot">↗</span><b class="touch-copy">Drag anywhere to wander</b><b class="keyboard-copy">Use arrow keys or WASD</b><span>Munch flowers. ${scene.world.mode === 'stroll' ? 'Take your time.' : 'Mind the dog.'}</span></div>
    <div id="hide-status" class="hide-status" hidden>${icon.leaf}<span>Perfectly ordinary bush.</span><div class="sniff-track"><i></i></div></div>
    <div id="threat" class="threat" hidden><span>↟</span><b>WOOF!</b></div>
    <div id="toast" class="toast" role="status"></div>
    <div id="joystick" class="joystick" hidden><div></div></div>
    <div class="game-bottom"><span>${scene.world.mode === 'stroll' ? 'Nowhere to be. Flowers to eat.' : 'Slow down in bushes to hide.'}</span></div>`;
}
function modal(title: string, eyebrow: string, content: string, className = '') {
  modalFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  ui.insertAdjacentHTML('beforeend', `<div class="modal-shade"><section class="card ${className}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="eyebrow">${eyebrow}</div><h2 id="modal-title">${title}</h2>${content}</section></div>`);
  ui.querySelector<HTMLElement>('.card button')?.focus();
}
function removeModal() { ui.querySelector('.modal-shade')?.remove(); modalFocus?.focus(); }
function pause() {
  if (screen !== 'playing' || scene.world.phase === 'caught') return;
  scene.pause(); screen = 'paused'; document.body.dataset.screen = screen;
  modal('A little breather.', 'THE MEADOW CAN WAIT', `<p>No rush. The dog can wait too.</p><div class="card-flower">${icon.flower}</div><button class="primary" data-action="resume">Back to mischief ${icon.arrow}</button><button class="secondary" data-action="finish">Call it an afternoon</button><button class="text-button" data-action="settings">Settings</button>`);
}
function showResults(caught: boolean) {
  clearTimeout(roundTimer); const w = scene.world; scene.pause();
  const old = w.mode === 'stroll' ? save.strollBest : save.best;
  result = { score: w.score, time: w.time, mode: w.mode, newBest: w.score > old };
  if (w.mode === 'stroll') save.strollBest = Math.max(old, w.score); else save.best = Math.max(old, w.score);
  writeSave(save); removeModal(); screen = 'results'; document.body.dataset.screen = screen;
  ui.querySelector('#start-hint')?.remove();
  modal(caught ? verdict(w.score) : 'An afternoon well spent.', caught ? 'APPREHENDED. NOT SORRY.' : 'HOME BEFORE TEATIME',
    `<p>${caught ? 'Back to the pen. With absolutely no regrets.' : 'A little wandering does a lamb good.'}</p>
    <div class="result-score">${icon.flower}<strong>${w.score}</strong><span>flowers happily eaten</span></div>
    <div class="result-details"><span>TIME OUTSIDE<b>${formatTime(w.time)}</b></span><span>${result.newBest ? 'A NEW PERSONAL BEST!' : 'PERSONAL BEST'}<b>${w.mode === 'stroll' ? save.strollBest : save.best}</b></span></div>
    <button class="primary" data-action="again">${caught ? 'One more little escape' : 'Another little wander'} ${icon.arrow}</button>
    <button class="text-button" data-action="home">Back to the meadow</button>`, 'result-card');
}
function showHelp() {
  screen = 'help'; modal('A guide to mischief.', 'IT’S A SIMPLE LITTLE LIFE',
    `<div class="instructions"><div><span>01</span><p><b>Find your feet.</b>Drag anywhere on a phone. Use arrows or WASD on a keyboard.</p></div><div><span>02</span><p><b>Follow your appetite.</b>Walk over flowers to munch them. Every flower is a point.</p></div><div><span>03</span><p><b>Be an ordinary bush.</b>Slow down inside leafy bushes to hide. If the dog saw you enter, keep an eye on the sniff meter.</p></div><div><span>04</span><p><b>Mind the woof.</b>The edge marker warns you about an approaching dog. Change direction during his bursts, then escape while he catches his breath.</p></div></div><button class="primary" data-action="close">I was born for this ${icon.arrow}</button>`);
}
function showSettings() {
  if (screen === 'playing') pause();
  previousScreen = screen === 'paused' ? 'paused' : 'menu'; removeModal(); screen = 'settings';
  modal('Make yourself comfy.', 'YOUR LITTLE CORNER',
    `<div class="settings-list"><button class="setting" data-action="sound"><span>Meadow sounds<small>Little munches and gentle woofs</small></span><b id="sound-state">${save.muted ? 'OFF' : 'ON'}</b></button><button class="setting" data-action="motion" aria-pressed="${save.reducedMotion}"><span>Less motion<small>A quieter bounce and fewer petals</small></span><b id="motion-state">${save.reducedMotion ? 'ON' : 'OFF'}</b></button></div><p class="settings-note">Your best scores stay in this browser.</p><button class="primary" data-action="close">Lovely. Thank you. ${icon.arrow}</button>`);
}
function formatTime(seconds: number) { return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`; }
function toast(text: string) {
  const element = document.querySelector('#toast'); if (!element) return;
  element.textContent = text; element.classList.add('visible'); toastTimer = performance.now() + 2300;
}
scene.hooks = {
  ready: renderMenu,
  toast,
  caught: () => { toast('Caught wool-handed.'); roundTimer = setTimeout(() => showResults(true), 1100); },
  update: (w) => {
    if (screen !== 'playing') return;
    if (w.score !== lastScore) { const score = document.querySelector('#score'); if (score) score.textContent = String(w.score); lastScore = w.score; }
    if (Math.floor(w.time) !== lastSecond) { const timer = document.querySelector('#timer'); if (timer) timer.textContent = formatTime(w.time); lastSecond = Math.floor(w.time); }
    document.querySelector('#start-hint')?.classList.toggle('faded', w.phase !== 'ready');
    const hidden = document.querySelector<HTMLElement>('#hide-status');
    if (hidden) { hidden.hidden = !w.hidden; const bar = hidden.querySelector<HTMLElement>('i'); if (bar) bar.style.width = `${Math.min(w.sniff / 2.5, 1) * 100}%`; }
    if (performance.now() > toastTimer) document.querySelector('#toast')?.classList.remove('visible');
    const threat = document.querySelector<HTMLElement>('#threat');
    if (threat) {
      const p = scene.dogScreenPosition(), width = scene.scale.width, height = scene.scale.height;
      const outside = p.x < 35 || p.x > width - 35 || p.y < 80 || p.y > height - 55;
      threat.hidden = !(w.mode === 'classic' && w.dog.state !== 'arriving' && outside && distance(w.dog, w.lamb) < 850 && w.phase !== 'caught');
      if (!threat.hidden) {
        threat.style.left = `${clamp(p.x, 38, width - 38)}px`; threat.style.top = `${clamp(p.y, 112, height - 75)}px`;
        const arrow = threat.querySelector<HTMLElement>('span')!;
        arrow.style.transform = `rotate(${Math.atan2(p.y - height * .43, p.x - width / 2) + Math.PI / 2}rad)`;
        threat.classList.toggle('urgent', distance(w.dog, w.lamb) < 400);
      }
    }
  }
};
scene.inputController = new InputController(root, (active, x, y, dx, dy) => {
  const joystick = document.querySelector<HTMLElement>('#joystick'); if (!joystick) return;
  joystick.hidden = !active; joystick.style.left = `${x}px`; joystick.style.top = `${y}px`;
  const thumb = joystick.firstElementChild as HTMLElement; thumb.style.transform = `translate(${dx}px,${dy}px)`;
});
ui.innerHTML = `<div class="loading"><span>${icon.flower}</span><p>Opening the meadow…</p></div>`;
const game = new Phaser.Game({
  type: Phaser.CANVAS, parent: 'game', backgroundColor: '#dce6b9',
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  render: { antialias: true, roundPixels: false, powerPreference: 'low-power' },
  audio: { noAudio: true }, scene: [scene], banner: false
});
game.canvas.addEventListener('webglcontextlost', () => { pause(); toast('The meadow needs a moment.'); });
ui.addEventListener('click', e => {
  const button = (e.target as Element).closest<HTMLButtonElement>('button[data-action]'); if (!button) return;
  const action = button.dataset.action; audio.unlock(); audio.click();
  if (action === 'reload') { location.reload(); return; }
  if (action === 'sound') {
    save.muted = !save.muted; audio.muted = save.muted; writeSave(save);
    ui.querySelectorAll('.sound-button').forEach(b => { b.innerHTML = save.muted ? icon.mute : icon.sound; b.setAttribute('aria-label', save.muted ? 'Turn sound on' : 'Mute sound'); b.setAttribute('aria-pressed', String(!save.muted)); });
    const state = document.querySelector('#sound-state'); if (state) state.textContent = save.muted ? 'OFF' : 'ON'; return;
  }
  if (action === 'motion') { save.reducedMotion = !save.reducedMotion; scene.reducedMotion = save.reducedMotion; writeSave(save); button.setAttribute('aria-pressed', String(save.reducedMotion)); document.querySelector('#motion-state')!.textContent = save.reducedMotion ? 'ON' : 'OFF'; return; }
  if (action === 'play' || action === 'stroll' || action === 'again') {
    clearTimeout(roundTimer); const mode = action === 'again' ? result?.mode ?? 'classic' : action === 'stroll' ? 'stroll' : 'classic';
    scene.startRound(mode); renderPlay(); (document.activeElement as HTMLElement)?.blur(); return;
  }
  if (action === 'pause') return pause();
  if (action === 'resume') { removeModal(); renderPlay(); scene.resume(); (document.activeElement as HTMLElement)?.blur(); return; }
  if (action === 'finish') return showResults(false);
  if (action === 'home') return renderMenu();
  if (action === 'help') return showHelp();
  if (action === 'settings') return showSettings();
  if (action === 'close') {
    removeModal();
    if (screen === 'settings' && previousScreen === 'paused') { screen = 'playing'; pause(); }
    else renderMenu();
  }
});
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (screen === 'playing') pause();
    else if (screen === 'paused') { removeModal(); renderPlay(); scene.resume(); }
    else if (screen === 'help' || screen === 'settings') (ui.querySelector('[data-action="close"]') as HTMLButtonElement)?.click();
  }
  if (e.key === 'Tab') {
    const dialog = ui.querySelector('.card'); if (!dialog) return;
    const controls = [...dialog.querySelectorAll<HTMLElement>('button')], first = controls[0], last = controls[controls.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('blur', pause);
window.addEventListener('orientationchange', pause);
window.addEventListener('error', event => {
  console.error('Meadow error:', event.message);
  if (screen === 'loading') ui.innerHTML = `<div class="loading"><p>The meadow couldn’t open.</p><button class="primary" data-action="reload">Try again</button></div>`;
});
// Read-only state makes development browser checks possible without production cheats.
if (import.meta.env.DEV) Object.defineProperty(window, '__lamb', { get: () => ({ phase: scene.world.phase, screen, x: scene.world.lamb.x, y: scene.world.lamb.y, score: scene.world.score, time: scene.world.time }) });
