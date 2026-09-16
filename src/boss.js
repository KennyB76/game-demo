import * as THREE from 'three';
import { BOSS, COLORS, FEEL, HAZARD } from './config.js';
import {
  collectMaterials, createBlobShadow, createBossModel, createRaindropModel, createShieldModel, createTelegraphModel, createThunderModel, setFlash,
} from './shapes.js';
import { clamp, clampToArena, damp, easeOutCubic, lerp, lerpAngle, Spring } from './util.js';

const tmp = new THREE.Vector3();

export class Boss {
  // opts.shields = Cloud Gate 에서 못 깬 방어막 겹 수, opts.bonusHp = 그만큼 더해진 HP
  constructor(game, pos, opts = {}) {
    this.game = game;
    this.group = new THREE.Group();
    this.group.position.copy(pos);
    this.floater = new THREE.Group();
    this.squash = new THREE.Group();
    this.model = createBossModel();
    this.squash.add(this.model.root);
    this.floater.add(this.squash);
    this.shadow = createBlobShadow(BOSS.radius * 1.1);
    this.group.add(this.floater, this.shadow);
    this.mats = collectMaterials(this.model.root);
    game.world.add(this.group);

    this.radius = BOSS.radius;
    this.baseHp = BOSS.hp;
    this.shields = opts.shields ?? 0;
    this.bonusPer = this.shields > 0 ? (opts.bonusHp ?? 0) / this.shields : 0;
    this.maxHp = this.baseHp + this.bonusPer * this.shields;
    this.hp = this.maxHp;
    this.bubbles = [];
    for (let i = 0; i < this.shields; i++) {
      const b = createShieldModel(BOSS.radius * 1.2 + i * 0.3);
      this.squash.add(b);
      this.bubbles.push(b);
    }
    this.state = 'enter';
    this.t = 0;
    this.time = 0;
    this.height = BOSS.enterHeight;
    this.cooldown = BOSS.firstAttackDelay;
    this.patternIndex = 0;
    this.pattern = 'rain';
    this.kb = new THREE.Vector3();
    this.spring = new Spring(160, 9);
    this.flash = 0;
    this.yaw = 0;
    this.burstTimer = 0;
  }

  get position() {
    return this.group.position;
  }

  get targetable() {
    return this.state === 'idle' || this.state === 'cast';
  }

  get angry() {
    return this.hp < this.baseHp * BOSS.angryAt;
  }

  update(dt) {
    if (dt <= 0) return;
    const g = this.game;
    this.t += dt;
    this.time += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.position.addScaledVector(this.kb, dt);
    this.kb.multiplyScalar(Math.exp(-BOSS.knockbackFriction * dt));

    tmp.subVectors(g.player.position, this.position).setY(0);
    const dist = tmp.length();
    if (dist > 0.001) tmp.divideScalar(dist);

    let puff = 1;
    let wiggle = 0;

    switch (this.state) {
      case 'enter': {
        const k = clamp(this.t / BOSS.enterTime, 0, 1);
        this.height = lerp(BOSS.enterHeight, BOSS.floatHeight, easeOutCubic(k));
        if (k >= 1) {
          this.state = 'idle';
          this.t = 0;
          g.shake(0.35);
          this.spring.kick(4);
        }
        break;
      }
      case 'idle': {
        // 주인공을 가리지 않도록 카메라 반대편(화면 위쪽)에 머문다
        const home = new THREE.Vector3().copy(g.player.position).addScaledVector(g.camForward, BOSS.keepDistance);
        clampToArena(home, this.radius);
        home.sub(this.position).setY(0);
        const far = home.length();
        if (far > 0.3) this.position.addScaledVector(home.divideScalar(far), Math.min(far, BOSS.moveSpeed * dt));
        this.cooldown -= dt;
        if (this.cooldown <= 0 && g.player.targetable) {
          this.pattern = BOSS.pattern[this.patternIndex++ % BOSS.pattern.length];
          this.state = 'cast';
          this.t = 0;
        }
        break;
      }
      case 'cast': {
        const k = clamp(this.t / BOSS.castTime, 0, 1);
        puff = 1 + 0.18 * Math.sin(k * Math.PI);
        wiggle = Math.sin(this.t * 30) * 0.08 * k;
        if (k >= 1) {
          this.fire(this.pattern);
          this.state = 'idle';
          this.t = 0;
          this.cooldown = this.angry ? BOSS.cooldownAngry : BOSS.cooldown;
          this.spring.kick(-3);
        }
        break;
      }
      case 'pop': {
        const k = clamp(this.t / BOSS.popTime, 0, 1);
        wiggle = Math.sin(this.t * 40) * 0.15 * (1 - k);
        puff = k < 0.75 ? 1 + k * 0.4 : 1.3 * (1 - (k - 0.75) / 0.25);
        this.burstTimer -= dt;
        if (this.burstTimer <= 0 && k < 0.8) {
          this.burstTimer = 0.12;
          tmp.copy(this.position).setY(this.height).add(new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 2));
          g.particles.burst(tmp, { count: 8, kinds: ['star', 'heart'], colors: [...COLORS.particleStar, ...COLORS.particleHeart], speed: 5, up: 4, size: 0.24, life: 0.8 });
        }
        if (k >= 1) {
          this.state = 'gone';
          this.group.visible = false;
          tmp.copy(this.position).setY(1.5);
          g.particles.burst(tmp, { count: FEEL.particles.bossPop, kinds: ['star', 'heart', 'dot'], colors: [...COLORS.particleStar, ...COLORS.particleHeart, COLORS.boss], speed: 8, up: 7, size: 0.3, life: 1.2 });
          g.shake(FEEL.bossPopShake);
          for (let i = 0; i < 7; i++) {
            const a = (i / 7) * Math.PI * 2;
            g.spawnFlower(new THREE.Vector3(this.position.x + Math.cos(a) * 1.3, 0, this.position.z + Math.sin(a) * 1.3));
          }
          g.onBossDefeated();
        }
        break;
      }
    }

    clampToArena(this.position, this.radius * 0.5);
    if (this.state !== 'pop' && dist > 0.01) this.yaw = lerpAngle(this.yaw, Math.atan2(tmp.x, tmp.z), damp(3, dt));
    this.group.rotation.y = this.yaw;

    const s = this.spring.update(dt);
    this.floater.position.y = this.height + Math.sin(this.time * 2) * 0.15;
    this.floater.rotation.z = wiggle;
    const p = Math.max(puff, 0.0001);
    this.squash.scale.set((1 + s * 0.5) * p, (1 - s) * p, (1 + s * 0.5) * p);
    this.shadow.scale.setScalar(clamp(1.4 - this.height * 0.1, 0.3, 1.2) * Math.min(1, p));
    setFlash(this.mats, this.flash > 0 ? 1 : 0);
    this.bubbles.forEach((b, i) => {
      b.rotation.y = this.time * (0.6 + i * 0.25);
      b.rotation.z = Math.sin(this.time * 1.5 + i) * 0.2;
    });
    g.hud.setBossHp(this.hp, this.baseHp, this.maxHp);
  }

  popShield() {
    const g = this.game;
    const b = this.bubbles.pop();
    this.squash.remove(b);
    this.shields--;
    g.hud.setBossShields(this.shields);
    tmp.copy(this.position).setY(this.height);
    g.particles.burst(tmp, { count: 22, kinds: ['dot', 'star'], colors: COLORS.particleShield, speed: 7, up: 3, size: 0.22, life: 0.7, spread: 2 });
    g.shake(0.3);
    g.hud.showBanner(this.shields > 0 ? 'Pop!' : 'No more shields!');
  }

  fire(kind) {
    const g = this.game;
    const pp = g.player.position;
    if (kind === 'rain') {
      const R = BOSS.rain;
      const n = this.angry ? R.countAngry : R.count;
      for (let i = 0; i < n; i++) {
        const pos = new THREE.Vector3(pp.x, 0, pp.z);
        if (i > 0) {
          const a = Math.random() * Math.PI * 2;
          const d = Math.sqrt(Math.random()) * R.spread;
          pos.x += Math.cos(a) * d;
          pos.z += Math.sin(a) * d;
        }
        clampToArena(pos, R.radius);
        g.addHazard(new Hazard(g, { kind: 'rain', pos, radius: R.radius, telegraph: R.telegraph, damage: R.damage, delay: i * R.stagger }));
      }
    } else {
      const T = BOSS.thunder;
      g.addHazard(new Hazard(g, { kind: 'thunder', pos: new THREE.Vector3(pp.x, 0, pp.z), radius: T.radius, telegraph: T.telegraph, damage: T.damage, delay: 0 }));
      if (this.angry) {
        for (let i = 0; i < T.extraAngry; i++) {
          const a = Math.random() * Math.PI * 2;
          const pos = new THREE.Vector3(pp.x + Math.cos(a) * T.extraOffset, 0, pp.z + Math.sin(a) * T.extraOffset);
          clampToArena(pos, T.radius);
          g.addHazard(new Hazard(g, { kind: 'thunder', pos, radius: T.radius * 0.8, telegraph: T.telegraph, damage: T.damage, delay: T.extraDelay * (i + 1) }));
        }
      }
    }
  }

  takeHit(damage, dir, knockback, step) {
    if (!this.targetable) return false;
    const g = this.game;
    this.hp = Math.max(0, this.hp - damage);
    while (this.shields > 0 && this.hp <= this.baseHp + (this.shields - 1) * this.bonusPer) this.popShield();
    this.flash = FEEL.flashTime;
    this.kb.copy(dir).multiplyScalar(knockback * BOSS.knockbackScale);
    this.spring.kick(FEEL.hitSquashKick * 0.6);
    tmp.copy(this.position).setY(this.height + 1.4);
    g.numbers.spawn(tmp, damage, step?.big);
    tmp.setY(this.height - 0.3);
    g.particles.burst(tmp, { count: FEEL.particles.hit, kinds: ['star', 'heart'], colors: [...COLORS.particleStar, ...COLORS.particleHeart], speed: 3.5, up: 3, size: 0.2, life: 0.55 });
    if (this.hp <= 0) {
      this.state = 'pop';
      this.t = 0;
      g.clearHazards();
      g.onBossPopping();
    }
    return true;
  }
}

export class Hazard {
  constructor(game, o) {
    this.game = game;
    this.kind = o.kind;
    this.pos = o.pos.clone();
    this.radius = o.radius;
    this.telegraph = o.telegraph;
    this.damage = o.damage;
    this.t = -o.delay;
    this.landed = false;
    this.after = 0;
    this.done = false;

    this.tele = createTelegraphModel();
    this.tele.root.scale.setScalar(this.radius);
    this.tele.root.position.set(this.pos.x, 0.03, this.pos.z);
    this.tele.root.visible = false;
    this.faller = this.kind === 'rain' ? createRaindropModel() : createThunderModel();
    this.faller.scale.setScalar(this.kind === 'rain' ? 1.2 : this.radius * 0.6);
    this.faller.position.set(this.pos.x, HAZARD.fallHeight, this.pos.z);
    this.faller.visible = false;
    game.world.add(this.tele.root, this.faller);
  }

  update(dt) {
    if (dt <= 0 || this.done) return;
    const g = this.game;
    this.t += dt;
    if (this.t < 0) return;

    if (!this.landed) {
      this.tele.root.visible = true;
      const k = clamp(this.t / this.telegraph, 0, 1);
      this.tele.fill.scale.setScalar(Math.max(k, 0.001));
      this.tele.ring.material.opacity = 0.45 + 0.3 * Math.abs(Math.sin(this.t * (6 + k * 10)));
      const fallStart = this.telegraph - HAZARD.fallTime;
      if (this.t >= fallStart) {
        this.faller.visible = true;
        const q = clamp((this.t - fallStart) / HAZARD.fallTime, 0, 1);
        this.faller.position.y = lerp(HAZARD.fallHeight, 0.4, q * q);
        this.faller.rotation.y += dt * 8;
      }
      if (this.t >= this.telegraph) this.land();
    } else {
      this.after += dt;
      const k = clamp(this.after / HAZARD.splashTime, 0, 1);
      const base = this.kind === 'rain' ? 1.2 : this.radius * 0.6;
      this.faller.scale.set(base * (1 + k), base * Math.max(0.001, 1 - k), base * (1 + k));
      if (k >= 1) this.dispose();
    }
  }

  land() {
    const g = this.game;
    this.landed = true;
    this.tele.root.visible = false;
    const p = g.player;
    const d = Math.hypot(p.position.x - this.pos.x, p.position.z - this.pos.z);
    if (d <= this.radius + HAZARD.hitRadiusBonus) p.takeHit(this.damage, this.pos);
    tmp.copy(this.pos).setY(0.3);
    if (this.kind === 'rain') {
      g.particles.burst(tmp, { count: 10, kinds: ['dot'], colors: COLORS.particleRain, speed: 3, up: 3, size: 0.12, life: 0.5 });
      g.shake(0.08);
    } else {
      g.particles.burst(tmp, { count: 18, kinds: ['star', 'dot'], colors: [COLORS.thunder, 0xffffff], speed: 6, up: 4, size: 0.2, life: 0.6, spread: this.radius });
      g.shake(0.25);
    }
  }

  dispose() {
    this.done = true;
    this.game.world.remove(this.tele.root, this.faller);
  }
}

