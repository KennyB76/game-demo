import { ARENA } from './config.js';

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (sharpness, dt) => 1 - Math.exp(-sharpness * dt);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// 원형 경기장 안으로 가둔다
export function clampToArena(pos, radius) {
  const max = ARENA.radius - radius;
  const len = Math.hypot(pos.x, pos.z);
  if (len > max) {
    pos.x *= max / len;
    pos.z *= max / len;
  }
}

// squash & stretch 용 감쇠 스프링. kick(+) = 눌림, kick(-) = 늘어남
export class Spring {
  constructor(k = 180, d = 12) {
    this.k = k;
    this.d = d;
    this.x = 0;
    this.v = 0;
  }
  kick(v) {
    this.v += v;
  }
  update(dt) {
    this.v += (-this.k * this.x - this.d * this.v) * dt;
    this.x += this.v * dt;
    this.x = clamp(this.x, -0.6, 0.6);
    return this.x;
  }
}

export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
