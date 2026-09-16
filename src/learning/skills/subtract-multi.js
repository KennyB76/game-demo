import { buildChoices, digitAt, digitCount, fmt, makeRng, MINUS, randInt, randomDigits } from '../numbers.js';

// 4.NBT.B.4 — 여러 자리 뺄셈 (Ch2 선행 · 0 건너 빌리기는 subtract-across-zeros 가 맡는다)
export function borrowColumns(a, b) {
  const cols = [];
  let borrow = 0;
  for (let k = 0; k < digitCount(a); k++) {
    const top = digitAt(a, k) - borrow;
    borrow = top < digitAt(b, k) ? 1 : 0;
    if (borrow) cols.push(k);
  }
  return cols;
}

// 자리마다 큰 수에서 작은 수를 빼는 실수
export function smallFromLarge(a, b) {
  let r = 0;
  for (let k = 0; k < digitCount(a); k++) r += Math.abs(digitAt(a, k) - digitAt(b, k)) * 10 ** k;
  return r;
}

export default {
  id: 'subtract-multi',
  standard: '4.NBT.B.4',
  chapter: 2,
  name: 'Subtracting big numbers',
  intro: {
    title: 'Subtracting big numbers',
    text: 'Line up the places. Start with the ones. Top digit too small? Regroup 1 from the next place.',
    example: `852 ${MINUS} 317 = 535`,
  },
  generate(level, seed) {
    const rng = makeRng(seed);
    let a;
    let b;
    let cols;
    for (;;) {
      if (level === 1) {
        a = randomDigits(rng, 3, { zeroFree: true });
        b = randomDigits(rng, 3);
      } else if (level === 2) {
        a = randomDigits(rng, 4, { zeroFree: true });
        b = randomDigits(rng, randInt(rng, 3, 4));
      } else {
        a = randomDigits(rng, 5, { zeroFree: true });
        b = randomDigits(rng, randInt(rng, 4, 5));
      }
      if (b >= a) continue;
      cols = borrowColumns(a, b);
      const want = [cols.length === 0, cols.length === 1, cols.length >= 2][level - 1];
      if (want) break;
    }
    const diff = a - b;
    const { answer, choices } = buildChoices(rng, diff, [smallFromLarge(a, b), ...cols.map((k) => diff + 10 ** (k + 1)), diff - 10, diff + 100], {
      fill: () => diff + randInt(rng, -9, 9) * 10 ** randInt(rng, 0, 2),
    });
    return {
      prompt: `${fmt(a)} ${MINUS} ${fmt(b)} = ?`,
      answer,
      choices,
      hint: 'Start with the ones. If the top digit is smaller, regroup 1 from the next place.',
      explain: `${fmt(a)} ${MINUS} ${fmt(b)} = ${fmt(diff)}. Check: ${fmt(diff)} + ${fmt(b)} = ${fmt(a)}.`,
    };
  },
};
