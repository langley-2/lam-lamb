export class AudioGarden {
  context?: AudioContext;
  muted = false;
  unlock() { try { this.context ??= new AudioContext(); void this.context.resume(); } catch { /* Silent play remains supported. */ } }
  note(freq: number, length = .12, type: OscillatorType = 'sine', gain = .045, delay = 0) {
    if (this.muted || !this.context || this.context.state !== 'running') return;
    const c = this.context, now = c.currentTime + delay, oscillator = c.createOscillator(), amp = c.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(freq, now);
    oscillator.frequency.exponentialRampToValueAtTime(freq * .8, now + length);
    amp.gain.setValueAtTime(0, now); amp.gain.linearRampToValueAtTime(gain, now + .008); amp.gain.exponentialRampToValueAtTime(.001, now + length);
    oscillator.connect(amp); amp.connect(c.destination); oscillator.start(now); oscillator.stop(now + length + .02);
  }
  munch(score: number) { this.note([523, 587, 659, 784, 880][score % 5], .11, 'sine', .06); this.note(1100, .04, 'triangle', .018, .05); }
  bark() { this.note(180, .13, 'triangle', .075); this.note(145, .16, 'triangle', .055, .18); }
  hide() { this.note(440, .15, 'sine', .035); this.note(660, .2, 'sine', .03, .1); }
  caught() { [392, 330, 262].forEach((f, i) => this.note(f, .25, 'triangle', .04, i * .16)); }
  click() { this.note(700, .06, 'sine', .025); }
}
