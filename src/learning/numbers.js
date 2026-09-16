// 수 표기 · 결정적 난수 · 선택지 조립 — 문제 생성 함수들이 같이 쓴다. (브라우저 · node 공용, 외부 의존 없음)

// ── 결정적 난수 (mulberry32) ────────────────────────────
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randInt = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
export const pickOne = (rng, arr) => arr[Math.floor(rng() * arr.length)];

export function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── 표기 ────────────────────────────────────────────────
export function fmt(n) {
  const s = String(Math.abs(n));
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) out += ',';
    out += s[i];
  }
  return n < 0 ? '-' + out : out;
}

export const MINUS = '−';

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function under1000(n) {
  const parts = [];
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h) parts.push(`${ONES[h]} hundred`);
  if (r) {
    if (r < 20) parts.push(ONES[r]);
    else parts.push(TENS[Math.floor(r / 10)] + (r % 10 ? '-' + ONES[r % 10] : ''));
  }
  return parts.join(' ');
}

// 0 ~ 999,999 (미국식 · "and" 없음)
export function toWords(n) {
  if (n === 0) return 'zero';
  const th = Math.floor(n / 1000);
  const r = n % 1000;
  const parts = [];
  if (th) parts.push(`${under1000(th)} thousand`);
  if (r) parts.push(under1000(r));
  return parts.join(' ');
}

export function expandedTerms(n) {
  const s = String(n);
  const terms = [];
  for (let i = 0; i < s.length; i++) {
    const d = Number(s[i]);
    if (d) terms.push(d * 10 ** (s.length - 1 - i));
  }
  return terms;
}

export const toExpanded = (n) => expandedTerms(n).map(fmt).join(' + ');

export const PLACE_NAMES = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands'];
export const ROUND_WORDS = { 10: 'ten', 100: 'hundred', 1000: 'thousand' };

export const digitAt = (n, k) => Math.floor(n / 10 ** k) % 10;
export const digitCount = (n) => String(n).length;

// 반 올림 (양의 정수)
export function roundTo(n, place) {
  const q = Math.floor(n / place);
  return (n % place) * 2 >= place ? (q + 1) * place : q * place;
}

// 첫 자리 1~9, 나머지 0~9 인 d 자리 수
export function randomDigits(rng, d, { zeroFree = false } = {}) {
  let n = randInt(rng, 1, 9);
  for (let i = 1; i < d; i++) n = n * 10 + (zeroFree ? randInt(rng, 1, 9) : randInt(rng, 0, 9));
  return n;
}

// ── 선택지 ──────────────────────────────────────────────
// answer 와 오답 후보(자주 하는 실수 순서) → 중복 없는 선택지. 모자라면 fill() 로 채운다.
export function buildChoices(rng, answer, wrongs, { count = 4, format = fmt, valid = defaultValid, fill } = {}) {
  const seen = new Set([format(answer)]);
  const picked = [];
  const tryAdd = (w) => {
    if (picked.length >= count - 1 || w === null || w === undefined || !valid(w)) return;
    const key = format(w);
    if (seen.has(key)) return;
    seen.add(key);
    picked.push(w);
  };
  for (const w of wrongs) tryAdd(w);
  for (let guard = 0; picked.length < count - 1 && fill && guard < 200; guard++) tryAdd(fill());
  const values = shuffle(rng, [answer, ...picked]);
  return { answer: format(answer), choices: values.map(format) };
}

// 4학년 범위: 모든 수는 0 ~ 1,000,000
export const MAX_VALUE = 1000000;

function defaultValid(w) {
  return typeof w !== 'number' || (Number.isInteger(w) && w >= 0 && w <= MAX_VALUE);
}
