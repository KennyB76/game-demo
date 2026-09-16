// 손맛 효과 — 파티클(별 · 하트), 데미지 숫자, 화면 흔들림
import * as THREE from 'three';
import { COLORS, CSS_COLORS, FEEL } from './config.js';
import { createHeartGeometry, createStarGeometry } from './shapes.js';
import { pick } from './util.js';

export class Particles {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.items = [];
    this.geos = {
      star: createStarGeometry(),
      heart: createHeartGeometry(),
      dot: new THREE.CircleGeometry(1, 14),
    };
  }

  burst(pos, o = {}) {
    const count = o.count ?? 8;
    const kinds = o.kinds ?? ['star'];
    const colors = o.colors ?? COLORS.particleStar;
    const speed = o.speed ?? 3;
    const up = o.up ?? 3;
    const size = o.size ?? 0.18;
    const life = o.life ?? 0.6;
    const gravity = o.gravity ?? -6;
    const spread = o.spread ?? 0.2;
    for (let i = 0; i < count; i++) {
      const kind = kinds[i % kinds.length];
      const mat = new THREE.MeshBasicMaterial({ color: pick(colors), transparent: true, depthWrite: false, side: THREE.DoubleSide });
      const m = new THREE.Mesh(this.geos[kind], mat);
      m.position.set(pos.x + (Math.random() - 0.5) * spread, pos.y + (Math.random() - 0.5) * spread, pos.z + (Math.random() - 0.5) * spread);
      const a = Math.random() * Math.PI * 2;
      const sp = speed * (0.5 + Math.random() * 0.5);
      this.items.push({
        m,
        vel: new THREE.Vector3(Math.cos(a) * sp, up * (0.6 + Math.random() * 0.6), Math.sin(a) * sp),
        age: 0,
        life: life * (0.7 + Math.random() * 0.6),
        size: size * (0.7 + Math.random() * 0.6),
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 8,
        gravity,
      });
      m.renderOrder = 5;
      this.scene.add(m);
    }
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.age += dt;
      if (p.age >= p.life) {
        this.scene.remove(p.m);
        p.m.material.dispose();
        this.items.splice(i, 1);
        continue;
      }
      p.vel.y += p.gravity * dt;
      p.vel.multiplyScalar(Math.exp(-2 * dt));
      p.m.position.addScaledVector(p.vel, dt);
      const k = p.age / p.life;
      const s = p.size * (k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.6) / 0.4));
      p.m.scale.setScalar(Math.max(s, 0.0001));
      p.rot += p.spin * dt;
      p.m.quaternion.copy(this.camera.quaternion);
      p.m.rotateZ(p.rot);
    }
  }

  clear() {
    for (const p of this.items) {
      this.scene.remove(p.m);
      p.m.material.dispose();
    }
    this.items.length = 0;
  }
}

const tmp = new THREE.Vector3();

export class DamageNumbers {
  constructor(layer, camera) {
    this.layer = layer;
    this.camera = camera;
    this.items = [];
  }

  spawn(worldPos, value, big = false) {
    const el = document.createElement('div');
    el.className = 'dmg' + (big ? ' big' : '');
    const inner = document.createElement('span');
    inner.textContent = value;
    inner.style.color = big ? CSS_COLORS.damageBig : pick(CSS_COLORS.damage);
    el.appendChild(inner);
    this.layer.appendChild(el);
    this.items.push({ el, pos: worldPos.clone(), vx: (Math.random() - 0.5) * 1.2, age: 0 });
  }

  update(dt) {
    const { life, rise } = FEEL.damageNumber;
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const d = this.items[i];
      d.age += dt;
      const k = d.age / life;
      if (k >= 1) {
        d.el.remove();
        this.items.splice(i, 1);
        continue;
      }
      d.pos.y += rise * dt * (1 - k);
      d.pos.x += d.vx * dt;
      tmp.copy(d.pos).project(this.camera);
      const x = (tmp.x * 0.5 + 0.5) * w;
      const y = (-tmp.y * 0.5 + 0.5) * h;
      d.el.style.transform = `translate(${x}px, ${y}px)`;
      d.el.style.opacity = k > 0.7 ? String(1 - (k - 0.7) / 0.3) : '1';
    }
  }

  clear() {
    for (const d of this.items) d.el.remove();
    this.items.length = 0;
  }
}

export class Shake {
  constructor() {
    this.trauma = 0;
    this.offset = new THREE.Vector3();
  }
  add(amount) {
    this.trauma = Math.min(1, this.trauma + amount);
  }
  update(dt) {
    this.trauma = Math.max(0, this.trauma - FEEL.shakeDecay * dt);
    const s = this.trauma * this.trauma * FEEL.shakeMax;
    this.offset.set((Math.random() * 2 - 1) * s, (Math.random() * 2 - 1) * s, (Math.random() * 2 - 1) * s);
    return this.offset;
  }
}
