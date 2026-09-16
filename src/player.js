import * as THREE from 'three';
import { COLORS, FEEL, KEYS, PLAYER } from './config.js';
import { collectMaterials, createBlobShadow, createHeroModel, createSwipeModel, setFlash } from './shapes.js';
import { clamp, clampToArena, damp, lerp, lerpAngle, Spring } from './util.js';

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const WAND_REST = 0.35;

export class Player {
  constructor(game) {
    this.game = game;
    this.group = new THREE.Group();
    this.squash = new THREE.Group();
    this.pivot = new THREE.Group();
    this.pivot.position.y = PLAYER.centerHeight;
    this.model = createHeroModel();
    this.model.root.position.y = -PLAYER.centerHeight;
    this.pivot.add(this.model.root);
    this.squash.add(this.pivot);
    this.group.add(this.squash, createBlobShadow(PLAYER.radius * 1.3));
    this.swipes = PLAYER.combo.map((s) => {
      const m = createSwipeModel(s.range, s.arcDeg);
      m.visible = false;
      this.group.add(m);
      return m;
    });
    this.mats = collectMaterials(this.model.root);
    game.world.add(this.group);

    this.radius = PLAYER.radius;
    this.hearts = PLAYER.maxHearts;
    this.vel = new THREE.Vector3();
    this.facing = new THREE.Vector3(0, 0, 1);
    this.moveInput = new THREE.Vector3();
    this.dashDir = new THREE.Vector3();
    this.aim = null;
    this.state = 'normal';
    this.t = 0;
    this.attackBuffer = 0;
    this.dashBuffer = 0;
    this.comboIndex = 0;
    this.comboTimer = 0;
    this.dashCooldown = 0;
    this.invuln = 0;
    this.iframes = 0;
    this.flash = 0;
    this.animT = 0;
    this.spring = new Spring();
    this.controllable = true;
    this.hitDone = false;
    this.dizzyTimer = 0;
  }

  get position() {
    return this.group.position;
  }

  get targetable() {
    return this.state !== 'down' && this.state !== 'cheer';
  }

  readInput(input) {
    this.moveInput.set(0, 0, 0);
    if (!this.controllable || this.state === 'down') return;
    const g = this.game;
    let f = 0;
    let r = 0;
    if (input.isDown(KEYS.up)) f += 1;
    if (input.isDown(KEYS.down)) f -= 1;
    if (input.isDown(KEYS.right)) r += 1;
    if (input.isDown(KEYS.left)) r -= 1;
    this.moveInput.copy(g.camForward).multiplyScalar(f).addScaledVector(g.camRight, r);
    if (this.moveInput.lengthSq() > 0) this.moveInput.normalize();

    if (input.wasPressed(KEYS.attack)) {
      this.attackBuffer = PLAYER.inputBuffer;
      this.aim = null;
    }
    if (input.mousePressed) {
      this.attackBuffer = PLAYER.inputBuffer;
      this.aim = g.mouseGround();
    }
    if (input.wasPressed(KEYS.dash)) this.dashBuffer = PLAYER.inputBuffer;
  }

  update(dt) {
    if (dt <= 0) return;
    this.animT += dt;
    this.attackBuffer = Math.max(0, this.attackBuffer - dt);
    this.dashBuffer = Math.max(0, this.dashBuffer - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.iframes = Math.max(0, this.iframes - dt);
    this.flash = Math.max(0, this.flash - dt);

    switch (this.state) {
      case 'normal': this.updateNormal(dt); break;
      case 'attack': this.updateAttack(dt); break;
      case 'dash': this.updateDash(dt); break;
      case 'hurt': this.updateHurt(dt); break;
      case 'down': this.updateDown(dt); break;
      case 'cheer': this.updateCheer(dt); break;
    }

    this.position.addScaledVector(this.vel, dt);
    clampToArena(this.position, this.radius);

    const yaw = Math.atan2(this.facing.x, this.facing.z);
    this.group.rotation.y = lerpAngle(this.group.rotation.y, yaw, damp(PLAYER.turnSharpness, dt));

    const s = this.spring.update(dt);
    const breathe = this.state === 'normal' ? Math.sin(this.animT * 3) * 0.025 : 0;
    this.squash.scale.set(1 + s * 0.5, 1 - s + breathe, 1 + s * 0.5);

    setFlash(this.mats, this.flash > 0 ? 1 : 0);
    const blink = this.invuln > 0 && this.state !== 'down' && Math.floor(this.invuln * 14) % 2 === 0;
    this.model.root.visible = !blink;
  }

  updateNormal(dt) {
    tmp.copy(this.moveInput).multiplyScalar(PLAYER.moveSpeed);
    this.vel.lerp(tmp, damp(PLAYER.accel, dt));
    const moving = this.moveInput.lengthSq() > 0;
    if (moving) this.facing.copy(this.moveInput);

    const w = this.model.parts.wandPivot;
    w.rotation.x = lerp(w.rotation.x, WAND_REST, damp(12, dt));
    w.rotation.z = lerp(w.rotation.z, 0, damp(12, dt));
    this.pivot.rotation.y = 0;
    const speedK = clamp(this.vel.length() / PLAYER.moveSpeed, 0, 1);
    this.pivot.rotation.z = Math.sin(this.animT * 14) * 0.12 * speedK;
    this.pivot.position.y = PLAYER.centerHeight + Math.abs(Math.sin(this.animT * 14)) * 0.08 * speedK;

    if (this.dashBuffer > 0 && this.dashCooldown <= 0) return this.startDash();
    if (this.attackBuffer > 0) {
      const next = this.comboTimer > 0 ? this.comboIndex + 1 : 0;
      return this.startAttack(next % PLAYER.combo.length);
    }
  }

  startAttack(i) {
    this.state = 'attack';
    this.t = 0;
    this.comboIndex = i;
    this.hitDone = false;
    this.attackBuffer = 0;
    this.comboTimer = 0;
    if (this.aim) {
      tmp.subVectors(this.aim, this.position).setY(0);
      if (tmp.lengthSq() > 0.01) this.facing.copy(tmp.normalize());
    } else if (this.moveInput.lengthSq() > 0) {
      this.facing.copy(this.moveInput);
    }
    this.aim = null;
    this.group.rotation.y = Math.atan2(this.facing.x, this.facing.z);
    this.pivot.rotation.set(0, 0, 0);
    this.pivot.position.y = PLAYER.centerHeight;
    this.hideSwipes();
    this.spring.kick(FEEL.attackStretchKick);
  }

  updateAttack(dt) {
    const s = PLAYER.combo[this.comboIndex];
    this.t += dt;
    const t = this.t;
    const strike = s.windup + s.active;
    if (t < strike) this.vel.copy(this.facing).multiplyScalar(s.lunge / strike);
    else this.vel.multiplyScalar(Math.exp(-12 * dt));

    // 지팡이 휘두르기 (3타는 한 바퀴 회전)
    const w = this.model.parts.wandPivot;
    const side = this.comboIndex === 1 ? -1 : 1;
    if (t < s.windup) {
      w.rotation.x = lerp(WAND_REST, -1.4, t / s.windup);
      w.rotation.z = lerp(0, 0.6 * side, t / s.windup);
    } else if (t < strike) {
      const k = (t - s.windup) / s.active;
      w.rotation.x = lerp(-1.4, 1.6, k);
      w.rotation.z = lerp(0.6 * side, -0.6 * side, k);
      if (s.arcDeg >= 360) this.pivot.rotation.y = k * Math.PI * 2;
    } else {
      const k = clamp((t - strike) / s.recovery, 0, 1);
      w.rotation.x = lerp(1.6, WAND_REST, k);
      w.rotation.z = lerp(-0.6 * side, 0, k);
      this.pivot.rotation.y = 0;
    }

    if (!this.hitDone && t >= s.windup) {
      this.hitDone = true;
      this.doHit(s);
    }

    const sw = this.swipes[this.comboIndex];
    const showEnd = strike + PLAYER.swipeLinger;
    if (t >= s.windup && t < showEnd) {
      const k = (t - s.windup) / (showEnd - s.windup);
      sw.visible = true;
      sw.material.opacity = 0.95 * (1 - k * k);
      sw.scale.setScalar(0.75 + k * 0.35);
    } else {
      sw.visible = false;
    }

    if (t >= strike) {
      if (this.dashBuffer > 0 && this.dashCooldown <= 0) return this.startDash();
      if (this.attackBuffer > 0 && this.comboIndex < PLAYER.combo.length - 1 && t >= strike + s.cancelAfter) {
        return this.startAttack(this.comboIndex + 1);
      }
    }
    if (t >= strike + s.recovery) {
      this.state = 'normal';
      this.hideSwipes();
      this.comboTimer = this.comboIndex < PLAYER.combo.length - 1 ? PLAYER.comboWindow : 0;
    }
  }

  doHit(s) {
    const g = this.game;
    const half = (s.arcDeg * Math.PI) / 360;
    let hits = 0;
    for (const e of g.targets()) {
      const dx = e.position.x - this.position.x;
      const dz = e.position.z - this.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > s.range + e.radius) continue;
      let ok = s.arcDeg >= 360 || dist < e.radius + this.radius + 0.2;
      if (!ok) {
        const dot = (dx * this.facing.x + dz * this.facing.z) / dist;
        ok = Math.acos(clamp(dot, -1, 1)) <= half + Math.atan2(e.radius, dist);
      }
      if (!ok) continue;
      if (dist > 0.001) tmp2.set(dx / dist, 0, dz / dist);
      else tmp2.copy(this.facing);
      if (e.takeHit(s.damage, tmp2, s.knockback, s)) hits++;
    }
    if (hits) {
      g.hitStop(s.hitstop);
      g.shake(s.shake);
    }
    tmp.copy(this.facing).multiplyScalar(s.arcDeg >= 360 ? 0 : s.range * 0.6).add(this.position);
    tmp.y = 0.7;
    g.particles.burst(tmp, { count: FEEL.particles.swipe * (s.big ? 3 : 1), kinds: ['star'], speed: s.big ? 5 : 2.5, up: 2, size: 0.14, life: 0.45, spread: s.big ? 1.5 : 0.6 });
  }

  startDash() {
    this.state = 'dash';
    this.t = 0;
    this.dashBuffer = 0;
    this.attackBuffer = 0;
    this.hideSwipes();
    this.dashDir.copy(this.moveInput.lengthSq() > 0 ? this.moveInput : this.facing);
    this.facing.copy(this.dashDir);
    this.group.rotation.y = Math.atan2(this.facing.x, this.facing.z);
    this.iframes = PLAYER.dash.iframes;
    this.pivot.position.y = PLAYER.centerHeight;
    this.pivot.rotation.set(0, 0, 0);
    this.spring.kick(FEEL.dashKick);
    tmp.copy(this.position).setY(0.2);
    this.game.particles.burst(tmp, { count: 6, kinds: ['dot'], colors: COLORS.particleDust, speed: 2, up: 1, size: 0.14, life: 0.4, gravity: 0 });
  }

  updateDash(dt) {
    const D = PLAYER.dash;
    this.t += dt;
    const k = clamp(this.t / D.duration, 0, 1);
    this.vel.copy(this.dashDir).multiplyScalar(D.speed * (1 - k * 0.5));
    this.pivot.rotation.x = k * Math.PI * 2;
    if (k >= 1) {
      this.pivot.rotation.x = 0;
      this.state = 'normal';
      this.dashCooldown = D.cooldown;
      this.vel.multiplyScalar(0.3);
      this.spring.kick(2);
    }
  }

  updateHurt(dt) {
    this.t += dt;
    this.vel.multiplyScalar(Math.exp(-8 * dt));
    if (this.t >= PLAYER.hurtStun) this.state = 'normal';
  }

  updateDown(dt) {
    this.t += dt;
    this.vel.multiplyScalar(Math.exp(-6 * dt));
    this.pivot.rotation.z = lerp(this.pivot.rotation.z, 1.35, damp(8, dt));
    this.pivot.position.y = lerp(this.pivot.position.y, 0.35, damp(8, dt));
    this.dizzyTimer -= dt;
    if (this.dizzyTimer <= 0) {
      this.dizzyTimer = 0.25;
      tmp.copy(this.position).setY(1.2);
      this.game.particles.burst(tmp, { count: 2, kinds: ['star'], speed: 1.5, up: 0.8, size: 0.12, life: 0.6, gravity: 0 });
    }
  }

  updateCheer(dt) {
    this.t += dt;
    this.vel.multiplyScalar(Math.exp(-8 * dt));
    this.pivot.position.y = PLAYER.centerHeight + Math.abs(Math.sin(this.t * 6)) * 0.6;
    this.pivot.rotation.set(0, 0, 0);
    this.model.parts.wandPivot.rotation.x = -2.6 + Math.sin(this.t * 12) * 0.3;
    this.facing.copy(this.game.camForward).negate();
  }

  cheer() {
    this.state = 'cheer';
    this.t = 0;
    this.controllable = false;
    this.invuln = 0;
    this.hideSwipes();
  }

  hideSwipes() {
    for (const m of this.swipes) m.visible = false;
  }

  takeHit(amount, fromPos) {
    if (!this.targetable || this.invuln > 0 || this.iframes > 0 || !this.controllable) return false;
    const g = this.game;
    this.hearts = Math.max(0, this.hearts - amount);
    g.hud.setHearts(this.hearts, PLAYER.maxHearts, true);

    tmp.subVectors(this.position, fromPos).setY(0);
    if (tmp.lengthSq() < 0.0001) tmp.copy(this.facing).negate();
    tmp.normalize();
    this.vel.copy(tmp).multiplyScalar(PLAYER.hurtKnockback);
    this.flash = FEEL.flashTime * 1.5;
    this.spring.kick(FEEL.hurtSquashKick);
    this.invuln = PLAYER.hurtInvuln;
    this.hideSwipes();
    this.pivot.rotation.set(0, 0, 0);
    this.pivot.position.y = PLAYER.centerHeight;
    g.shake(FEEL.hurtShake);
    g.hitStop(FEEL.hurtHitstop);
    tmp.copy(this.position).setY(1.1);
    g.particles.burst(tmp, { count: 5, kinds: ['heart'], colors: COLORS.particleHeart, speed: 2, up: 3, size: 0.2, life: 0.7 });

    this.t = 0;
    if (this.hearts <= 0) {
      this.state = 'down';
      this.invuln = 0;
      g.onPlayerDown();
    } else {
      this.state = 'hurt';
    }
    return true;
  }
}
