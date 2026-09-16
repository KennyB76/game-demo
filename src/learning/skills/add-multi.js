import { buildChoices, digitAt, digitCount, fmt, makeRng, randInt, randomDigits } from '../numbers.js';

// 4.NBT.B.4 — 여러 자리 덧셈 (Ch2 선행)
function regroupColumns(a, b) {
  const cols = [];
  let carry = 0;
  const n = Math.max(digitCount(a), digitCount(b));
  for (let k = 0; k < n; k++) {
    const s = digitAt(a, k) + digitAt(b, k) + carry;
    carry = s >= 10 ? 1 : 0;
    if (carry) cols.push(k);
  }
  return cols;
}

// 받아올림을 잊은 답: 자리마다 합의 일의 자리만
function noCarry(a, b) {
  let r = 0;
  const n = Math.max(digitCount(a), digitCount(b));
  for (let k = 0; k < n; k++) r += ((digitAt(a, k) + digitAt(b, k)) % 10) * 10 ** k;
  return r;
}

const TIMES = ['', 'once', 'two times', 'three times', 'four times', 'five times'];
const carryText = (n) => (n === 0 ? '' : n === 1 ? '. Carry the 1 once' : `. Carry a 1 ${TIMES[n]}`);

export default {
  id: 'add-multi',
  standard: '4.NBT.B.4',
  chapter: 2,
  name: 'Adding big numbers',
  intro: {
    title: 'Adding big numbers',
    text: 'Line up the places. Add from the right. 10 or more? Carry 1 to the next place.',
    example: '1,258 + 364 = 1,622',
  },
  generate(level, seed) {
    const rng = makeRng(seed);
    let a;
    let b;
    let cols;
    for (;;) {
      if (level === 1) {
        a = randomDigits(rng, 3);
        b = randomDigits(rng, 3);
      } else if (level === 2) {
        a = randomDigits(rng, 4);
        b = randomDigits(rng, randInt(rng, 3, 4));
      } else {
        a = randomDigits(rng, 5);
        b = randomDigits(rng, randInt(rng, 4, 5));
      }
      cols = regroupColumns(a, b);
      const want = [cols.length === 0, cols.length === 1, cols.length >= 2][level - 1];
      if (want && a + b < 1000000) break;
    }
    const sum = a + b;
    const { answer, choices } = buildChoices(rng, sum, [noCarry(a, b), ...cols.map((k) => sum - 10 ** (k + 1)), sum + 10, sum - 100], {
      fill: () => sum + randInt(rng, -9, 9) * 10 ** randInt(rng, 0, 2),
    });
    return {
      prompt: `${fmt(a)} + ${fmt(b)} = ?`,
      answer,
      choices,
      hint: 'Line up the places. Add the ones first. 10 or more? Carry 1 to the next place.',
      explain: `Add each place from right to left${carryText(cols.length)}. ${fmt(a)} + ${fmt(b)} = ${fmt(sum)}.`,
    };
  },
};
