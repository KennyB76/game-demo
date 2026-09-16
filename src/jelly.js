import * as THREE from 'three';
import { COLORS, FEEL, JELLY } from './config.js';
import { collectMaterials, createBlobShadow, createJellyModel, setFlash } from './shapes.js';
import { clamp, clampToArena, damp, easeOutBack, lerpAngle, Spring } from './util.js';

const tmp = new THREE.Vector3();

export class Jelly {
  constructor(game, pos, variant, delay) {
    this.game = game;
    this.group = new THREE.Group();
    this.group.position.copy(pos);
    this.hopper = new THREE.Group();
    this.squash = new THREE.Group();
    const color = COLORS.jelly[variant % COLORS.jelly.length];
    this.model = createJellyModel(color);
    this.squash.add(this.model.root);
    this.hopper.add(this.squash);
    this.shadow = createBlobShadow(JELLY.radius * 1.15);
    this.group.add(this.hopper, this.shadow);
    this.mats = collectMaterials(this.model.root);
    this.squash.scale.setScalar(0.0001);
    this.shadow.visible = false;
    game.world.add(this.group);

    this.color = color;
    this.radius = JELLY.radius;
    this.hp = JELLY.hp;
    this.state = 'spawn';
    this.t = -delay;
    this.kb = new THREE.Vector3();
    this.lungeDir = new THREE.Vector3(0, 0, 1);
    this.spring = new Spring(200, 10);
    this.flash = 0;
    this.hopClock = JELLY.hopDuration + Math.random() * JELLY.hopInterval;
    this.yaw = Math.random() * Math.PI * 2;
    this.hitThisLunge = false;
  }

  get position() {
    return this.group.position;
  }

  get targetable() {
    return this.state !== 'spawn' && this.state !== 'pop' && this.state !== 'gone';
  }

  update(dt) {
    if (dt <= 0) return;
    const J = JELLY;
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.position.addScaledVector(this.kb, dt);
    this.kb.multiplyScalar(Math.exp(-J.knockbackFriction * dt));

    const player = this.game.player;
    tmp.subVectors(player.position, this.position).setY(0);
    const dist = tmp.length();
    if (dist > 0.001) tmp.divideScalar(dist);

    let hopY = 0;
    let sx = 1;
    let sy = 1;
    let grow = 1;
    let faceTarget = true;

    switch (this.state) {
      case 'spawn': {
        if (this.t < 0) {
          grow = 0;
          break;
        }
        this.shadow.visible = true;
        const k = clamp(this.t / J.spawnTime, 0, 1);
        grow = easeOutBack(k);
        if (k >= 1) this.setState('chase');
        break;
      }
      case 'chase': {
        const cycle = J.hopDuration + J.hopInterval;
        this.hopClock += dt;
        const c = this.hopClock % cycle;
        if (c < J.hopDuration) {
          const k = Math.sin((c / J.hopDuration) * Math.PI);
          hopY = k * J.hopHeight;
          sy = 1 + 0.25 * k;
          sx = 1 - 0.12 * k;
          if (dist > 0.01) this.position.addScaledVector(tmp, J.hopSpeed * dt);
        } else {
          const g = (c - J.hopDuration) / J.hopInterval;
          if (g < 0.2) {
            const q = 1 - g / 0.2;
            sy = 1 - 0.22 * q;
            sx = 1 + 0.15 * q;
          } else if (g > 0.7) {
            const q = (g - 0.7) / 0.3;
            sy = 1 - 0.18 * q;
            sx = 1 + 0.1 * q;
          }
          if (dist <= J.attackRange && player.targetable) this.setState('windup');
        }
        break;
      }
      case 'windup': {
        const k = clamp(this.t / J.windup, 0, 1);
        sy = 1 - 0.28 * k + Math.sin(this.t * 40) * 0.04 * k;
        sx = 1 + 0.2 * k;
        if (k < 0.7 && dist > 0.01) this.lungeDir.copy(tmp);
        if (k >= 1) {
          this.setState('lunge');
          this.hitThisLunge = false;
          this.spring.kick(-3);
        }
        break;
      }
      case 'lunge': {
        const k = clamp(this.t / J.lungeDuration, 0, 1);
        this.position.addScaledVector(this.lungeDir, J.lungeSpeed * dt);
        hopY = Math.sin(k * Math.PI) * 0.4;
        sy = 1.2;
        sx = 0.9;
        faceTarget = false;
        if (!this.hitThisLunge && dist <= this.radius + player.radius) {
          if (player.takeHit(J.damage, this.position)) this.hitThisLunge = true;
        }
        if (k >= 1) {
          this.setState('rest');
          this.spring.kick(3);
        }
        break;
      }
      case 'rest': {
        sy = 1 + Math.sin(this.t * 6) * 0.03;
        if (this.t >= J.rest) {
          this.setState('chase');
          this.hopClock = J.hopDuration;
        }
        break;
      }
      case 'hitstun': {
        faceTarget = false;
        if (this.t >= J.hitstun) {
          this.setState('chase');
          this.hopClock = J.hopDuration + J.hopInterval * 0.5;
        }
        break;
      }
      case 'pop': {
        const k = clamp(this.t / J.popTime, 0, 1);
        grow = k < 0.4 ? 1 + (k / 0.4) * 0.4 : 1.4 * (1 - (k - 0.4) / 0.6);
        faceTarget = false;
        this.shadow.scale.setScalar(Math.max(0.001, 1 - k));
        if (k >= 1) {
          this.state = 'gone';
          this.group.visible = false;
        }
        break;
      }
    }

    clampToArena(this.position, this.radius);

    if (faceTarget && dist > 0.01) this.yaw = lerpAngle(this.yaw, Math.atan2(tmp.x, tmp.z), damp(8, dt));
    this.group.rotation.y = this.yaw;

    const s = this.spring.update(dt);
    this.hopper.position.y = hopY;
    const g = Math.max(grow, 0.0001);
    this.squash.scale.set(sx * (1 + s * 0.5) * g, sy * (1 - s) * g, sx * (1 + s * 0.5) * g);
    if (this.state !== 'pop') this.shadow.scale.setScalar(Math.max(0.3, 1 - hopY * 0.6) * Math.min(1, grow));
    setFlash(this.mats, this.flash > 0 ? 1 : 0);
  }

  setState(s) {
    this.state = s;
    this.t = 0;
  }

  takeHit(damage, dir, knockback, step) {
    if (!this.targetable) return false;
    const g = this.game;
    this.hp -= damage;
    this.flash = FEEL.flashTime;
    this.kb.copy(dir).multiplyScalar(knockback * JELLY.knockbackScale);
    this.spring.kick(FEEL.hitSquashKick * (step?.big ? 1.4 : 1));
    tmp.copy(this.position).setY(1.3);
    g.numbers.spawn(tmp, damage, step?.big);
    tmp.setY(0.6);
    g.particles.burst(tmp, { count: FEEL.particles.hit, kinds: ['star', 'star', 'heart'], colors: [...COLORS.particleStar, ...COLORS.particleHeart], speed: 3.5, up: 3, size: 0.16, life: 0.5 });
    if (this.hp <= 0) this.die();
    else this.setState('hitstun');
    return true;
  }

  die() {
    const g = this.game;
    this.setState('pop');
    tmp.copy(this.position).setY(0.6);
    g.particles.burst(tmp, { count: FEEL.particles.pop, kinds: ['star', 'heart', 'dot'], colors: [this.color, ...COLORS.particleStar], speed: 4.5, up: 4, size: 0.2, life: 0.8 });
    g.shake(FEEL.enemyPopShake);
    g.spawnFlower(this.position);
  }
}
