// 엔티티 겉모습 — 엔티티마다 함수 하나. 나중에 3D 모델 로더로 이 함수만 바꿔 끼운다.
// 규약: 모델은 +Z 를 바라보고, 원점은 발밑(보스는 구름 중심).
import * as THREE from 'three';
import { ARENA, COLORS } from './config.js';
import { seededRandom } from './util.js';

let gradientMap = null;
function toonGradient() {
  if (!gradientMap) {
    gradientMap = new THREE.DataTexture(new Uint8Array([120, 200, 255]), 3, 1, THREE.RedFormat);
    gradientMap.minFilter = THREE.NearestFilter;
    gradientMap.magFilter = THREE.NearestFilter;
    gradientMap.needsUpdate = true;
  }
  return gradientMap;
}

export function toon(color, opts = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: toonGradient(), ...opts });
}

function flat(color, opts = {}) {
  return new THREE.MeshBasicMaterial({ color, ...opts });
}

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

const sphere = (r, seg = 20) => new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75));

export function starShape(outer = 1, inner = 0.45, points = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = Math.PI / 2 + (i * Math.PI) / points;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

export function createStarGeometry() {
  return new THREE.ShapeGeometry(starShape());
}

export function createHeartGeometry() {
  const s = new THREE.Shape();
  s.moveTo(5, 5);
  s.bezierCurveTo(5, 5, 4, 0, 0, 0);
  s.bezierCurveTo(-6, 0, -6, 7, -6, 7);
  s.bezierCurveTo(-6, 11, -3, 15.4, 5, 19);
  s.bezierCurveTo(12, 15.4, 16, 11, 16, 7);
  s.bezierCurveTo(16, 7, 16, 0, 10, 0);
  s.bezierCurveTo(7, 0, 5, 5, 5, 5);
  const g = new THREE.ShapeGeometry(s);
  g.translate(-5, -9.5, 0);
  g.scale(0.1, 0.1, 0.1);
  g.rotateZ(Math.PI);
  return g;
}

// 플래시(흰색 번쩍임)용 재질 목록
export function collectMaterials(root) {
  const mats = [];
  root.traverse((o) => {
    if (o.material && o.material.emissive) {
      o.material.userData.baseEmissive = o.material.emissive.clone();
      mats.push(o.material);
    }
  });
  return mats;
}

const WHITE = new THREE.Color(1, 1, 1);
export function setFlash(mats, k) {
  for (const m of mats) m.emissive.copy(m.userData.baseEmissive).lerp(WHITE, k);
}

export function createBlobShadow(radius) {
  const m = mesh(
    new THREE.CircleGeometry(radius, 28),
    flat(COLORS.shadow, { transparent: true, opacity: 0.22, depthWrite: false }),
    0, 0.02, 0,
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 1;
  return m;
}

// ── 경기장 ────────────────────────────────────────────────
export function createArenaModel() {
  const root = new THREE.Group();
  const R = ARENA.radius;
  const ground = mesh(new THREE.CylinderGeometry(R, R, 0.6, 72), toon(COLORS.ground), 0, -0.3, 0);
  const edge = mesh(new THREE.CylinderGeometry(R + 0.8, R + 1.1, 0.7, 72), toon(COLORS.groundEdge), 0, -0.42, 0);
  root.add(ground, edge);

  const rand = seededRandom(ARENA.seed);
  const bushGeo = sphere(0.7, 16);
  for (let i = 0; i < ARENA.bushCount; i++) {
    const a = (i / ARENA.bushCount) * Math.PI * 2;
    const b = mesh(bushGeo, toon(COLORS.bushes[i % COLORS.bushes.length]), Math.cos(a) * (R + 0.4), 0.15, Math.sin(a) * (R + 0.4));
    b.scale.setScalar(0.8 + rand() * 0.5);
    root.add(b);
  }

  const tuftGeo = sphere(0.14, 10);
  for (let i = 0; i < ARENA.tuftCount; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * (R - 1.2);
    const g = new THREE.Group();
    const c = COLORS.tufts[i % COLORS.tufts.length];
    g.add(mesh(tuftGeo, toon(c), 0, 0.02, 0), mesh(tuftGeo, toon(c), 0.15, 0, 0.06), mesh(tuftGeo, toon(c), -0.12, 0, 0.1));
    g.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
    root.add(g);
  }
  return root;
}

// ── 주인공: 별 지팡이 꼬마 마법사 ────────────────────────
export function createHeroModel() {
  const root = new THREE.Group();

  const robe = mesh(new THREE.CylinderGeometry(0.24, 0.46, 0.62, 24), toon(COLORS.heroRobe), 0, 0.31, 0);
  const trim = mesh(new THREE.TorusGeometry(0.44, 0.05, 8, 28), toon(COLORS.heroRobeTrim), 0, 0.04, 0);
  trim.rotation.x = Math.PI / 2;
  const collar = mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 24), toon(COLORS.heroRobeTrim), 0, 0.62, 0);
  collar.rotation.x = Math.PI / 2;

  const head = mesh(sphere(0.37, 24), toon(COLORS.heroSkin), 0, 0.98, 0);
  const hairCap = mesh(new THREE.SphereGeometry(0.39, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), toon(COLORS.heroHair), 0, 0.99, -0.02);
  hairCap.rotation.x = -0.45;
  const bunL = mesh(sphere(0.17, 16), toon(COLORS.heroHair), -0.37, 1.18, -0.06);
  const bunR = mesh(sphere(0.17, 16), toon(COLORS.heroHair), 0.37, 1.18, -0.06);

  const eyeGeo = sphere(0.055, 12);
  const eyeL = mesh(eyeGeo, toon(COLORS.heroEye), -0.13, 0.95, 0.33);
  const eyeR = mesh(eyeGeo, toon(COLORS.heroEye), 0.13, 0.95, 0.33);
  eyeL.scale.set(1, 1.35, 0.6);
  eyeR.scale.set(1, 1.35, 0.6);
  const shineGeo = sphere(0.018, 8);
  const shineL = mesh(shineGeo, flat(COLORS.shine), -0.115, 0.975, 0.365);
  const shineR = mesh(shineGeo, flat(COLORS.shine), 0.145, 0.975, 0.365);
  const blushGeo = sphere(0.06, 12);
  const blushL = mesh(blushGeo, flat(COLORS.heroBlush, { transparent: true, opacity: 0.7 }), -0.23, 0.87, 0.28);
  const blushR = mesh(blushGeo, flat(COLORS.heroBlush, { transparent: true, opacity: 0.7 }), 0.23, 0.87, 0.28);
  blushL.scale.set(1.4, 0.7, 0.4);
  blushR.scale.set(1.4, 0.7, 0.4);

  const handGeo = sphere(0.09, 12);
  const handL = mesh(handGeo, toon(COLORS.heroSkin), -0.36, 0.42, 0.08);

  // 지팡이: 오른손 피벗
  const wandPivot = new THREE.Group();
  wandPivot.position.set(0.36, 0.42, 0.08);
  const handR = mesh(handGeo, toon(COLORS.heroSkin));
  const stick = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.62, 10), toon(COLORS.wandStick), 0, 0.28, 0);
  const star = new THREE.Mesh(
    new THREE.ExtrudeGeometry(starShape(1, 0.48), { depth: 0.35, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.12, bevelSegments: 2 }),
    toon(COLORS.wandStar, { emissive: 0x6a5200 }),
  );
  star.geometry.center();
  star.scale.setScalar(0.15);
  star.position.set(0, 0.66, 0);
  wandPivot.add(handR, stick, star);
  wandPivot.rotation.x = 0.35;

  root.add(robe, trim, collar, head, hairCap, bunL, bunR, eyeL, eyeR, shineL, shineR, blushL, blushR, handL, wandPivot);
  return { root, parts: { wandPivot, star, head } };
}

// ── 잡몹: 심술 난 젤리 방울 ───────────────────────────────
export function createJellyModel(color) {
  const root = new THREE.Group();
  const body = mesh(sphere(0.55, 24), toon(color, { transparent: true, opacity: 0.93 }), 0, 0.47, 0);
  body.scale.set(1, 0.85, 1);
  const shine = mesh(sphere(0.1, 12), flat(COLORS.shine, { transparent: true, opacity: 0.85 }), -0.22, 0.74, 0.3);
  shine.scale.set(1, 0.6, 0.6);

  const eyeGeo = sphere(0.07, 12);
  const eyeL = mesh(eyeGeo, toon(COLORS.jellyFace), -0.17, 0.55, 0.5);
  const eyeR = mesh(eyeGeo, toon(COLORS.jellyFace), 0.17, 0.55, 0.5);
  const browGeo = new THREE.BoxGeometry(0.2, 0.045, 0.05);
  const browL = mesh(browGeo, toon(COLORS.jellyFace), -0.17, 0.68, 0.47);
  const browR = mesh(browGeo, toon(COLORS.jellyFace), 0.17, 0.68, 0.47);
  browL.rotation.z = -0.45;
  browR.rotation.z = 0.45;
  const mouth = mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 14, Math.PI), toon(COLORS.jellyFace), 0, 0.36, 0.53);

  root.add(body, shine, eyeL, eyeR, browL, browR, mouth);
  return { root, parts: { body } };
}

// ── 보스: 투덜 먹구름 ─────────────────────────────────────
export function createBossModel() {
  const root = new THREE.Group();
  const puffs = [
    [0, 0, 0, 1.0, COLORS.boss],
    [-0.95, -0.15, 0, 0.7, COLORS.boss],
    [0.95, -0.15, 0, 0.7, COLORS.boss],
    [0, 0.6, -0.15, 0.75, COLORS.boss],
    [-0.55, 0.42, 0.15, 0.6, COLORS.boss],
    [0.55, 0.42, 0.15, 0.6, COLORS.boss],
    [0, -0.35, -0.3, 0.8, COLORS.bossShade],
  ];
  for (const [x, y, z, r, c] of puffs) root.add(mesh(sphere(r, 24), toon(c), x, y, z));

  const eyeGeo = sphere(0.1, 14);
  const eyeL = mesh(eyeGeo, toon(COLORS.bossFace), -0.3, 0.08, 0.95);
  const eyeR = mesh(eyeGeo, toon(COLORS.bossFace), 0.3, 0.08, 0.95);
  eyeL.scale.set(1, 1.2, 0.6);
  eyeR.scale.set(1, 1.2, 0.6);
  const browGeo = new THREE.BoxGeometry(0.3, 0.06, 0.06);
  const browL = mesh(browGeo, toon(COLORS.bossFace), -0.3, 0.3, 0.95);
  const browR = mesh(browGeo, toon(COLORS.bossFace), 0.3, 0.3, 0.95);
  browL.rotation.z = -0.4;
  browR.rotation.z = 0.4;
  const mouth = mesh(new THREE.TorusGeometry(0.13, 0.035, 8, 16, Math.PI), toon(COLORS.bossFace), 0, -0.22, 0.98);
  const cheekGeo = sphere(0.1, 12);
  const cheekL = mesh(cheekGeo, flat(COLORS.bossCheek, { transparent: true, opacity: 0.6 }), -0.55, -0.1, 0.85);
  const cheekR = mesh(cheekGeo, flat(COLORS.bossCheek, { transparent: true, opacity: 0.6 }), 0.55, -0.1, 0.85);
  cheekL.scale.set(1.3, 0.7, 0.4);
  cheekR.scale.set(1.3, 0.7, 0.4);

  root.add(eyeL, eyeR, browL, browR, mouth, cheekL, cheekR);
  return { root, parts: {} };
}

// ── 꽃 (젤리가 사라진 자리) ──────────────────────────────
export function createFlowerModel(petalColor) {
  const root = new THREE.Group();
  root.add(mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.32, 8), toon(COLORS.flowerStem), 0, 0.16, 0));
  const leaf = mesh(sphere(0.07, 10), toon(COLORS.flowerStem), 0.07, 0.1, 0);
  leaf.scale.set(1.2, 0.4, 0.6);
  root.add(leaf);
  const head = new THREE.Group();
  head.position.y = 0.34;
  head.rotation.x = -0.5;
  head.add(mesh(sphere(0.07, 12), toon(COLORS.flowerCenter)));
  const petalGeo = sphere(0.075, 12);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const p = mesh(petalGeo, toon(petalColor), Math.cos(a) * 0.12, Math.sin(a) * 0.12, -0.01);
    p.scale.set(1, 1, 0.45);
    head.add(p);
  }
  root.add(head);
  return root;
}

// ── 공격 궤적 (마법 부채꼴) ──────────────────────────────
export function createSwipeModel(radius, arcDeg) {
  const arc = (Math.min(arcDeg, 359.9) * Math.PI) / 180;
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.8, 0.13, 6, 40, arc),
    flat(COLORS.swipe, { transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  m.rotation.set(-Math.PI / 2, 0, -Math.PI / 2 - arc / 2);
  m.position.y = 0.55;
  return m;
}

// ── 보스 예고: 바닥 그림자 원 ────────────────────────────
export function createTelegraphModel() {
  const root = new THREE.Group();
  const ring = mesh(
    new THREE.RingGeometry(0.9, 1, 48),
    flat(COLORS.telegraphRing, { transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  const fill = mesh(
    new THREE.CircleGeometry(1, 48),
    flat(COLORS.telegraphFill, { transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }),
  );
  fill.rotation.x = -Math.PI / 2;
  fill.position.y = 0.005;
  root.add(ring, fill);
  root.renderOrder = 2;
  return { root, ring, fill };
}

export function createRaindropModel() {
  const root = new THREE.Group();
  const drop = mesh(sphere(0.3, 16), toon(COLORS.raindrop, { transparent: true, opacity: 0.9 }), 0, 0, 0);
  const tip = mesh(new THREE.ConeGeometry(0.26, 0.45, 16), toon(COLORS.raindrop, { transparent: true, opacity: 0.9 }), 0, 0.3, 0);
  const shine = mesh(sphere(0.06, 8), flat(COLORS.shine), -0.1, 0.06, 0.24);
  root.add(drop, tip, shine);
  return root;
}

export function createThunderModel() {
  const root = new THREE.Group();
  const core = mesh(new THREE.IcosahedronGeometry(0.55, 0), toon(COLORS.thunder, { emissive: 0x7a6400 }));
  const glow = mesh(sphere(0.75, 16), flat(COLORS.thunder, { transparent: true, opacity: 0.3, depthWrite: false }));
  root.add(core, glow);
  return root;
}
