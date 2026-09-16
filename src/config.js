// 조정 수치는 전부 여기 — 속도 · 데미지 · 경직 · 색.
export const VERSION = 'v0.1-greybox';

export const KEYS = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  attack: ['Space', 'KeyJ'],
  dash: ['ShiftLeft', 'ShiftRight', 'KeyK'],
  restart: ['KeyR'],
  start: ['Space', 'Enter'],
};

export const CAMERA = {
  fov: 38,
  distance: 21,
  pitchDeg: 45,
  yawDeg: 45,
  followSharpness: 6,
  lookHeight: 0.6,
};

export const LIGHT = { hemi: 1.25, sun: 1.7 };

export const ARENA = {
  radius: 13,
  bushCount: 40,
  tuftCount: 60,
  seed: 7,
};

export const PLAYER = {
  radius: 0.45,
  centerHeight: 0.6,
  moveSpeed: 5.5,
  accel: 18,
  turnSharpness: 20,
  maxHearts: 5,
  hurtInvuln: 1.4,
  hurtStun: 0.25,
  hurtKnockback: 7,
  downTime: 1.3,
  inputBuffer: 0.25,
  comboWindow: 0.4,
  swipeLinger: 0.14,
  dash: { speed: 14, duration: 0.24, iframes: 0.32, cooldown: 0.4 },
  combo: [
    { damage: 10, range: 2.0, arcDeg: 140, windup: 0.07, active: 0.08, recovery: 0.2, cancelAfter: 0.06, lunge: 0.6, knockback: 5, hitstop: 0.05, shake: 0.12, big: false },
    { damage: 12, range: 2.1, arcDeg: 160, windup: 0.07, active: 0.08, recovery: 0.22, cancelAfter: 0.06, lunge: 0.7, knockback: 6, hitstop: 0.06, shake: 0.15, big: false },
    { damage: 24, range: 2.6, arcDeg: 360, windup: 0.14, active: 0.14, recovery: 0.38, cancelAfter: 0.3, lunge: 0.4, knockback: 11, hitstop: 0.11, shake: 0.32, big: true },
  ],
};

export const JELLY = {
  hp: 30,
  radius: 0.55,
  spawnTime: 0.45,
  spawnStagger: 0.25,
  hopSpeed: 3.2,
  hopDuration: 0.38,
  hopInterval: 0.6,
  hopHeight: 0.55,
  attackRange: 1.7,
  windup: 0.9,
  lungeSpeed: 7.5,
  lungeDuration: 0.22,
  rest: 1.1,
  hitstun: 0.4,
  damage: 1,
  knockbackScale: 1,
  knockbackFriction: 7,
  popTime: 0.35,
};

export const WAVES = {
  list: [{ count: 5 }, { count: 5 }],
  spawnRadius: 9,
  firstDelay: 0.8,
  betweenDelay: 1.8,
  bossDelay: 2.0,
};

export const BOSS = {
  name: 'Grumpy Cloud',
  hp: 360,
  radius: 1.5,
  floatHeight: 1.9,
  enterHeight: 12,
  enterTime: 1.6,
  moveSpeed: 2.2,
  keepDistance: 4.5,
  firstAttackDelay: 1.8,
  cooldown: 2.6,
  cooldownAngry: 2.0,
  angryAt: 0.5,
  castTime: 0.7,
  knockbackScale: 0.15,
  knockbackFriction: 6,
  popTime: 1.4,
  pattern: ['rain', 'thunder', 'rain'],
  rain: { count: 4, countAngry: 6, spread: 3.2, radius: 1.1, telegraph: 1.7, stagger: 0.18, damage: 1 },
  thunder: { radius: 2.1, telegraph: 2.2, damage: 1, extraAngry: 2, extraOffset: 3.2, extraDelay: 0.5 },
};

export const HAZARD = {
  fallTime: 0.35,
  fallHeight: 9,
  splashTime: 0.25,
  hitRadiusBonus: 0.15,
};

export const FEEL = {
  flashTime: 0.1,
  hitSquashKick: 5,
  attackStretchKick: -3,
  dashKick: -2,
  hurtSquashKick: 6,
  shakeMax: 0.45,
  shakeDecay: 2.2,
  hurtShake: 0.35,
  hurtHitstop: 0.08,
  enemyPopShake: 0.12,
  bossPopShake: 0.6,
  damageNumber: { life: 0.75, rise: 2.2 },
  particles: { hit: 6, pop: 14, bossPop: 40, swipe: 5 },
  confettiCount: 160,
};

// three 용 색 (0xRRGGBB) — 파스텔 팔레트
export const COLORS = {
  sky: 0xbfe6ff,
  ground: 0xb4ecd3,
  groundEdge: 0x8fd8b8,
  bushes: [0xffc8dd, 0xcdb4ff, 0xa2d2ff, 0xfff1a8],
  tufts: [0x9be3c2, 0xd4f5e4],
  shadow: 0x4f7a68,
  hemiSky: 0xffffff,
  hemiGround: 0xb4ecd3,
  sun: 0xfff6ea,

  heroRobe: 0xb9a7ff,
  heroRobeTrim: 0xfff1a8,
  heroSkin: 0xffe3d1,
  heroHair: 0xff9fc4,
  heroEye: 0x4a3f55,
  heroBlush: 0xff8fb1,
  wandStick: 0xfff7e0,
  wandStar: 0xffd84d,

  jelly: [0xff9ecf, 0x9ed8ff, 0xc9a7ff, 0xffc98a, 0x9ff0c5],
  jellyFace: 0x4a3f55,
  shine: 0xffffff,

  boss: 0xc9c5e6,
  bossShade: 0xaaa5d4,
  bossFace: 0x4a3f55,
  bossCheek: 0xff9fc4,

  telegraphRing: 0x6a4fa0,
  telegraphFill: 0x9b7fd0,
  raindrop: 0x7cc8ff,
  thunder: 0xffe75a,

  flowerPetals: [0xff8fb1, 0xffd166, 0xc3a6ff, 0x8fd3ff, 0xffffff],
  flowerCenter: 0xffe066,
  flowerStem: 0x5fc48f,

  swipe: 0xfff3a0,
  particleStar: [0xffe066, 0xfff7c2, 0xffffff, 0xffb3d9],
  particleHeart: [0xff7aa8, 0xffb3c7],
  particleRain: [0x7cc8ff, 0xbfe6ff],
  particleDust: [0xffffff, 0xe6fff4],
};

// HUD 용 색 (CSS)
export const CSS_COLORS = {
  text: '#5b4a6b',
  panel: 'rgba(255, 255, 255, 0.88)',
  accent: '#9d8cff',
  heart: '#ff6f9f',
  heartEmpty: '#eadcea',
  bossBar: '#ff8fc1',
  bossBarBg: '#ffe3ef',
  keycap: '#ffffff',
  keycapShadow: '#cdbdf2',
  titleA: '#ff7aa8',
  titleB: '#9d8cff',
  overlay: 'rgba(191, 230, 255, 0.55)',
  damage: ['#ff6fa5', '#ffa24d', '#6fb8ff', '#b07cff'],
  damageBig: '#ffb800',
  confetti: ['#ff8fb1', '#ffd166', '#9ed8ff', '#c3a6ff', '#9ff0c5', '#ffffff'],
};
