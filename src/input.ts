export class InputController {
  x = 0; y = 0;
  pointer: number | null = null;
  origin = { x: 0, y: 0 };
  keys = new Set<string>();
  enabled = false;
  constructor(private element: HTMLElement, private joystick: (active: boolean, x: number, y: number, dx: number, dy: number) => void) {
    element.addEventListener('pointerdown', e => {
      if (!this.enabled || this.pointer !== null || e.button > 0) return;
      this.pointer = e.pointerId; this.origin = { x: e.clientX, y: e.clientY };
      element.setPointerCapture(e.pointerId); this.joystick(true, e.clientX, e.clientY, 0, 0);
    });
    element.addEventListener('pointermove', e => {
      if (e.pointerId !== this.pointer || !this.enabled) return;
      const dx = e.clientX - this.origin.x, dy = e.clientY - this.origin.y, length = Math.hypot(dx, dy);
      const scale = length > 48 ? 48 / length : 1;
      const strength = Math.min(1, Math.max(0, (length - 7) / 41));
      this.x = length ? dx / length * strength : 0; this.y = length ? dy / length * strength : 0;
      this.joystick(true, this.origin.x, this.origin.y, dx * scale, dy * scale);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) element.addEventListener(event, e => {
      if ((e as PointerEvent).pointerId === this.pointer) this.clear();
    });
    window.addEventListener('keydown', e => {
      if (!this.enabled || (e.target instanceof HTMLElement && e.target.closest('button,input'))) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault(); this.keys.add(e.key.toLowerCase());
      }
    });
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.clear());
  }
  read() {
    if (!this.enabled) return { x: 0, y: 0 };
    if (this.keys.size) return {
      x: Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft')),
      y: Number(this.keys.has('s') || this.keys.has('arrowdown')) - Number(this.keys.has('w') || this.keys.has('arrowup'))
    };
    return { x: this.x, y: this.y };
  }
  clear() { this.x = this.y = 0; this.pointer = null; this.keys.clear(); this.joystick(false, 0, 0, 0, 0); }
}
