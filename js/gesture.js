// Gesture recognizer, ported from TouchGesturesWP8 (MouseGestures.cs / MouseGesture.cs).
// Drag movement is sampled in segments; each segment is classified as U, D, L or R when it
// is within MAX_ANGLE_ERROR degrees of an axis. Repeated directions collapse ("UU" -> "U").
// Device shake appends X or Y (dominant axis) and ends the gesture immediately.

const SEGMENT_LENGTH = 8;     // px in stage coordinates
const MAX_ANGLE_ERROR = 30;   // degrees
const MIN_GESTURE_SIZE = 30;  // px total travel

export class GestureRecognizer {
  /**
   * @param {HTMLElement} el element receiving pointer events
   * @param {() => number} getScale returns the current stage scale (screen px per stage px)
   * @param {HTMLElement} [refEl] element whose box defines the coordinate origin (defaults to el)
   */
  constructor(el, getScale = () => 1, refEl = null) {
    this.el = el;
    this.refEl = refEl || el;
    this.getScale = getScale;
    this.onGesture = null;     // (motions: string) => void, fired as the gesture grows
    this.onGestureEnd = null;  // (motions: string) => void
    this.onPointer = null;     // ({x, y, phase}) => void, stage coordinates
    this.motions = '';
    this.distance = 0;
    this.active = false;
    this.last = null;
    this.keyTimer = null;

    this._down = e => this.begin(e);
    this._move = e => this.move(e);
    this._up = e => this.end(e);
    el.addEventListener('pointerdown', this._down);
    el.addEventListener('pointermove', this._move);
    el.addEventListener('pointerup', this._up);
    el.addEventListener('pointercancel', this._up);

    this.shake = new ShakeDetector(type => this.addShake(type));
    this._key = e => this.key(e);
    window.addEventListener('keydown', this._key);
  }

  destroy() {
    const el = this.el;
    el.removeEventListener('pointerdown', this._down);
    el.removeEventListener('pointermove', this._move);
    el.removeEventListener('pointerup', this._up);
    el.removeEventListener('pointercancel', this._up);
    window.removeEventListener('keydown', this._key);
    this.shake.stop();
  }

  toStage(e) {
    const r = this.refEl.getBoundingClientRect();
    const s = this.getScale();
    return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s };
  }

  begin(e) {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    if (this.el.setPointerCapture) {
      try { this.el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    }
    this.active = true;
    this.motions = '';
    this.distance = 0;
    this.last = this.toStage(e);
    if (this.onPointer) this.onPointer({ ...this.last, phase: 'start' });
  }

  move(e) {
    if (!this.active) return;
    const p = this.toStage(e);
    if (this.onPointer) this.onPointer({ ...p, phase: 'move' });
    const dx = p.x - this.last.x, dy = p.y - this.last.y;
    const len = Math.hypot(dx, dy);
    if (len < SEGMENT_LENGTH) return;
    this.distance += len;
    this.last = p;
    const d = direction(dx, dy);
    if (this.addSegment(d) && this.onGesture) this.onGesture(this.motions);
  }

  end() {
    if (!this.active) return;
    this.active = false;
    if (this.onPointer) this.onPointer({ ...(this.last || { x: 0, y: 0 }), phase: 'end' });
    const m = this.motions;
    const far = this.distance >= MIN_GESTURE_SIZE;
    this.motions = '';
    this.distance = 0;
    if (far && m.length > 0) {
      if (this.onGesture) this.onGesture(m);
      if (this.onGestureEnd) this.onGestureEnd(m);
    }
  }

  addSegment(d) {
    if (!d) return false;
    if (this.motions.length && this.motions[this.motions.length - 1] === d) return false;
    this.motions += d;
    return true;
  }

  addShake(type) {
    if (this.addSegment(type)) {
      if (this.onGesture) this.onGesture(this.motions);
      if (this.onGestureEnd) this.onGestureEnd(this.motions);
      this.active = false;
      this.motions = '';
      this.distance = 0;
    }
  }

  // Keyboard fallback for desktop testing: arrows = U/D/L/R, X/Y = shake, Enter/Space ends.
  key(e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const map = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', x: 'X', y: 'Y', X: 'X', Y: 'Y' };
    const d = map[e.key];
    if (d) {
      e.preventDefault();
      this.distance = MIN_GESTURE_SIZE;
      if (d === 'X' || d === 'Y') { clearTimeout(this.keyTimer); this.addShake(d); return; }
      if (this.addSegment(d) && this.onGesture) this.onGesture(this.motions);
      clearTimeout(this.keyTimer);
      this.keyTimer = setTimeout(() => this.finishKeys(), 900);
    } else if (e.key === 'Enter' || e.key === ' ') {
      clearTimeout(this.keyTimer);
      this.finishKeys();
    }
  }

  finishKeys() {
    if (!this.motions) return;
    const m = this.motions;
    this.motions = '';
    this.distance = 0;
    if (this.onGestureEnd) this.onGestureEnd(m);
  }
}

/** Classify a movement vector. Screen y grows downward, so dy > 0 is Down. */
export function direction(dx, dy) {
  const len = Math.hypot(dx, dy);
  if (!len) return null;
  // angle measured from "down", clockwise through "right" (matches the C# math)
  let angle = Math.asin(Math.abs(dx) / len) * 180 / Math.PI;
  const sin = dx / len, cos = dy / len;
  if (sin >= 0 && cos < 0) angle = 180 - angle;
  else if (sin < 0 && cos < 0) angle = angle + 180;
  else if (sin < 0 && cos >= 0) angle = 360 - angle;
  const e = MAX_ANGLE_ERROR;
  if (angle > 360 - e || angle < e) return 'D';
  if (angle > 90 - e && angle < 90 + e) return 'R';
  if (angle > 180 - e && angle < 180 + e) return 'U';
  if (angle > 270 - e && angle < 270 + e) return 'L';
  return null;
}

/** Shake detection via devicemotion. Reports 'X' (side to side) or 'Y' (up and down). */
export class ShakeDetector {
  constructor(onShake, { threshold = 12, minMoves = 4, windowMs = 900 } = {}) {
    this.onShake = onShake;
    this.threshold = threshold;
    this.minMoves = minMoves;
    this.windowMs = windowMs;
    this.moves = [];
    this.lastFire = 0;
    this.prev = null;
    this._h = e => this.handle(e);
    this.started = false;
    this.start();
  }

  /** iOS 13+ only delivers devicemotion after a permission request made from a user gesture. */
  async requestPermission() {
    const DME = window.DeviceMotionEvent;
    if (DME && typeof DME.requestPermission === 'function') {
      try {
        if ((await DME.requestPermission()) === 'granted') this.start(true);
      } catch { /* denied */ }
    }
  }

  start(force = false) {
    if (this.started) return;
    const DME = window.DeviceMotionEvent;
    if (!DME) return;
    if (typeof DME.requestPermission === 'function' && !force) return; // wait for permission
    window.addEventListener('devicemotion', this._h);
    this.started = true;
  }

  stop() {
    window.removeEventListener('devicemotion', this._h);
    this.started = false;
  }

  handle(e) {
    const a = e.accelerationIncludingGravity || e.acceleration;
    if (!a || a.x == null) return;
    if (this.prev) {
      const dx = a.x - this.prev.x, dy = a.y - this.prev.y;
      const mag = Math.hypot(dx, dy);
      const now = performance.now();
      if (mag > this.threshold) {
        this.moves.push({ t: now, axis: Math.abs(dx) >= Math.abs(dy) ? 'X' : 'Y' });
        this.moves = this.moves.filter(m => now - m.t < this.windowMs);
        if (this.moves.length >= this.minMoves && now - this.lastFire > this.windowMs) {
          const xs = this.moves.filter(m => m.axis === 'X').length;
          const total = this.moves.length;
          this.lastFire = now;
          this.moves = [];
          this.onShake(xs >= total / 2 ? 'X' : 'Y');
        }
      }
    }
    this.prev = { x: a.x, y: a.y };
  }
}
