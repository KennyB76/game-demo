import * as THREE from 'three';
import { BOSS, CAMERA, COLORS, KEYS, LIGHT, PLAYER, WAVES } from './config.js';
import { Boss } from './boss.js';
import { DamageNumbers, Particles, Shake } from './fx.js';
import { Hud } from './hud.js';
import { Input } from './input.js';
import { Jelly } from './jelly.js';
import { Player } from './player.js';
import { createArenaModel, createFlowerModel } from './shapes.js';
import { currentStage } from './stages/index.js';
import { clamp, damp, easeOutBack, pick } from './util.js';

const tmp = new THREE.Vector3();

export class Game {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.sky);
    this.scene.fog = new THREE.Fog(COLORS.sky, 30, 60);

    this.camera = new THREE.PerspectiveCamera(CAMERA.fov, window.innerWidth / window.innerHeight, 0.1, 200);
    const yaw = THREE.MathUtils.degToRad(CAMERA.yawDeg);
    const pitch = THREE.MathUtils.degToRad(CAMERA.pitchDeg);
    this.camOffset = new THREE.Vector3(
      Math.sin(yaw) * Math.cos(pitch) * CAMERA.distance,
      Math.sin(pitch) * CAMERA.distance,
      Math.cos(yaw) * Math.cos(pitch) * CAMERA.distance,
    );
    this.camForward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    this.camRight = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    this.camTarget = new THREE.Vector3();

    this.scene.add(new THREE.HemisphereLight(COLORS.hemiSky, COLORS.hemiGround, LIGHT.hemi));
    const sun = new THREE.DirectionalLight(COLORS.sun, LIGHT.sun);
    sun.position.set(6, 12, 8);
    this.scene.add(sun);

    this.scene.add(createArenaModel());
    this.world = new THREE.Group();
    this.scene.add(this.world);

    this.input = new Input();
    this.hud = new Hud();
    this.particles = new Particles(this.scene, this.camera);
    this.numbers = new DamageNumbers(this.hud.numbers, this.camera);
    this.shaker = new Shake();
    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.mouseNdc = new THREE.Vector2();

    window.addEventListener('resize', () => this.onResize());
    document.getElementById('start-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.state === 'title') this.start();
    });

    this.stage = currentStage();
    this.waveTotal = this.stage.flow.filter((s) => s.type === 'wave').length;
    this.state = 'title';
    this.reset();
    this.hud.showScreen('title');
    this.camTarget.copy(this.player.position);

    this.last = performance.now();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  reset() {
    this.world.clear();
    this.particles.clear();
    this.numbers.clear();
    this.hud.clearConfetti();
    this.enemies = [];
    this.hazards = [];
    this.flowers = [];
    this.boss = null;
    this.player = new Player(this);
    this.stepIndex = -1;
    this.waveNumber = 0;
    this.phase = 'between';
    this.phaseTimer = WAVES.firstDelay;
    this.hitstopTimer = 0;
    this.endTimer = -1;
    this.hud.setHearts(PLAYER.maxHearts, PLAYER.maxHearts);
    this.hud.setWave(`Wave 1/${this.waveTotal}`);
    this.hud.showBossBar(false);
    this.hud.setBossHp(1);
  }

  start() {
    this.reset();
    this.state = 'play';
    this.hud.showScreen(null);
    this.input.endFrame();
  }

  targets() {
    const list = this.enemies.filter((e) => e.targetable);
    if (this.boss && this.boss.targetable) list.push(this.boss);
    return list;
  }

  hitStop(t) {
    this.hitstopTimer = Math.max(this.hitstopTimer, t);
  }

  shake(amount) {
    this.shaker.add(amount);
  }

  mouseGround() {
    this.mouseNdc.set((this.input.mouse.x / window.innerWidth) * 2 - 1, -(this.input.mouse.y / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.mouseNdc, this.camera);
    const hit = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.groundPlane, hit) ? hit : null;
  }

  addHazard(h) {
    this.hazards.push(h);
  }

  clearHazards() {
    for (const h of this.hazards) if (!h.done) h.dispose();
    this.hazards.length = 0;
  }

  spawnFlower(pos) {
    const root = createFlowerModel(pick(COLORS.flowerPetals));
    root.position.set(pos.x + (Math.random() - 0.5) * 0.3, 0, pos.z + (Math.random() - 0.5) * 0.3);
    root.rotation.y = Math.random() * Math.PI * 2;
    root.scale.setScalar(0.0001);
    this.world.add(root);
    this.flowers.push({ root, t: -0.15 - Math.random() * 0.15, size: 1.6 + Math.random() * 0.8 });
  }

  // 스테이지 흐름의 다음 단계로
  advance() {
    this.stepIndex++;
    const step = this.stage.flow[this.stepIndex];
    if (!step) return;
    if (step.type === 'wave') this.spawnWave(step);
    else if (step.type === 'quiz') this.startQuiz(step);
    else if (step.type === 'boss') this.spawnBoss(step);
  }

  nextStepType() {
    return this.stage.flow[this.stepIndex + 1]?.type;
  }

  startQuiz() {
    // 퀴즈 UI 는 다음 커밋 — 지금은 바로 다음 단계로
    this.phase = 'between';
    this.phaseTimer = 0.01;
  }

  spawnWave(W) {
    this.waveNumber++;
    this.phase = 'wave';
    this.hud.setWave(`Wave ${this.waveNumber}/${this.waveTotal}`);
    this.hud.showBanner(`Wave ${this.waveNumber}!`);
    const pp = this.player.position;
    const away = Math.atan2(-pp.z, -pp.x);
    for (let k = 0; k < W.count; k++) {
      const a = away + ((k - (W.count - 1) / 2) / W.count) * Math.PI * 1.4;
      const pos = new THREE.Vector3(Math.cos(a) * WAVES.spawnRadius, 0, Math.sin(a) * WAVES.spawnRadius);
      if (pos.distanceTo(pp) < 5) pos.multiplyScalar(-1);
      this.enemies.push(new Jelly(this, pos, k + this.waveNumber, k * 0.25));
    }
  }

  spawnBoss() {
    this.phase = 'boss';
    this.hud.setWave('Boss!');
    this.hud.showBanner(`Here comes ${BOSS.name}!`);
    this.hud.showBossBar(true);
    this.hud.setBossHp(1);
    const pp = this.player.position;
    const pos = new THREE.Vector3(-pp.x, 0, -pp.z);
    if (pos.length() < 3) pos.set(0, 0, -6);
    this.boss = new Boss(this, pos);
  }

  onPlayerDown() {
    this.endTimer = PLAYER.downTime;
  }

  onBossPopping() {
    this.player.controllable = false;
    this.hud.showBanner('Yay!');
  }

  onBossDefeated() {
    this.phase = 'done';
    this.state = 'clear';
    this.player.cheer();
    this.hud.showBossBar(false);
    this.hud.showScreen('clear');
    this.hud.burstConfetti();
  }

  frame() {
    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  }

  update(dt) {
    const input = this.input;
    if (this.state === 'title') {
      if (input.wasPressed(KEYS.start)) return this.start();
    } else if (input.wasPressed(KEYS.restart)) {
      return this.start();
    }

    if (this.state === 'play') this.player.readInput(input);
    else this.player.moveInput.set(0, 0, 0);
    input.endFrame();

    let gdt = dt;
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      gdt = 0;
    }

    if (this.state !== 'title') {
      this.player.update(gdt);
      for (const e of this.enemies) e.update(gdt);
      if (this.boss) this.boss.update(gdt);
      for (const h of this.hazards) h.update(gdt);
      this.hazards = this.hazards.filter((h) => !h.done);
      this.separate();
      this.enemies = this.enemies.filter((e) => {
        if (e.state !== 'gone') return true;
        this.world.remove(e.group);
        return false;
      });
      if (this.state === 'play') this.updateFlow(gdt);
    } else {
      this.player.update(dt);
    }

    this.updateFlowers(gdt);
    this.particles.update(gdt);
    this.numbers.update(dt);

    this.camTarget.lerp(this.player.position, damp(CAMERA.followSharpness, dt));
    const shake = this.shaker.update(dt);
    this.camera.position.copy(this.camTarget).add(this.camOffset).add(shake);
    tmp.copy(this.camTarget).setY(CAMERA.lookHeight).add(shake);
    this.camera.lookAt(tmp);
  }

  updateFlow(dt) {
    if (this.endTimer > 0) {
      this.endTimer -= dt;
      if (this.endTimer <= 0) {
        this.state = 'over';
        this.hud.showScreen('over');
      }
      return;
    }
    if (dt <= 0) return;
    if (this.phase === 'between') {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0) this.advance();
    } else if (this.phase === 'wave' && this.enemies.length === 0) {
      this.phase = 'between';
      const next = this.nextStepType();
      this.phaseTimer = next === 'boss' ? WAVES.bossDelay : next === 'quiz' ? WAVES.quizDelay : WAVES.betweenDelay;
      this.hud.showBanner(next === 'boss' ? 'Great job!' : 'Nice!');
    }
  }

  separate() {
    const list = this.enemies.filter((e) => e.targetable);
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        const dx = b.position.x - a.position.x;
        const dz = b.position.z - a.position.z;
        const d = Math.hypot(dx, dz);
        const min = a.radius + b.radius;
        if (d > 0.0001 && d < min) {
          const push = (min - d) / 2;
          a.position.x -= (dx / d) * push;
          a.position.z -= (dz / d) * push;
          b.position.x += (dx / d) * push;
          b.position.z += (dz / d) * push;
        }
      }
    }
    const p = this.player;
    for (const e of list) {
      if (e.state === 'lunge') continue;
      const dx = e.position.x - p.position.x;
      const dz = e.position.z - p.position.z;
      const d = Math.hypot(dx, dz);
      const min = e.radius + p.radius;
      if (d > 0.0001 && d < min) {
        e.position.x += (dx / d) * (min - d);
        e.position.z += (dz / d) * (min - d);
      }
    }
    if (this.boss && this.boss.targetable) {
      const b = this.boss;
      const dx = p.position.x - b.position.x;
      const dz = p.position.z - b.position.z;
      const d = Math.hypot(dx, dz);
      const min = b.radius * 0.8 + p.radius;
      if (d > 0.0001 && d < min) {
        p.position.x += (dx / d) * (min - d);
        p.position.z += (dz / d) * (min - d);
      }
    }
  }

  updateFlowers(dt) {
    for (const f of this.flowers) {
      if (f.t >= 0.6) continue;
      f.t += dt;
      const k = clamp(f.t / 0.6, 0, 1);
      f.root.scale.setScalar(Math.max(0.0001, easeOutBack(k) * f.size));
    }
  }
}
