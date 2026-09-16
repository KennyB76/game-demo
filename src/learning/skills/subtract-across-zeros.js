import { buildChoices, digitCount, fmt, makeRng, MINUS, pickOne, randInt } from '../numbers.js';
import { smallFromLarge } from './subtract-multi.js';

// 4.NBT.B.4 — 0 을 건너 빌리는 뺄셈 (예: 5,000 − 1,236 · Ch2 선행)
export default {
  id: 'subtract-across-zeros',
  standard: '4.NBT.B.4',
  chapter: 2,
  name: 'Subtracting across zeros',
  intro: {
    title: 'Subtracting across zeros',
    text: 'A zero has nothing to give. Go left to a digit that can. The zeros in between become 9s.',
    example: `400 ${MINUS} 126: 400 = 3 hundreds, 9 tens, 10 ones. Answer: 274`,
  },
  generate(level, seed) {
    const rng = makeRng(seed);
    const lead = randInt(rng, 2, 9);
    let a;
    if (level === 1) a = lead * 100;
    else if (level === 2) a = pickOne(rng, [lead * 1000, lead * 1000, lead * 1000 + randInt(rng, 1, 8)]);
    else a = pickOne(rng, [lead * 10000, lead * 10000 + randInt(rng, 1, 8), lead * 10000 + randInt(rng, 1, 9) * 100]);
    const d = digitCount(a);
    let b;
    for (;;) {
      b = randInt(rng, 10 ** (d - 2), a - 1);
      if (b % 10 > a % 10 && b % 10 !== 0) break;
    }
    const diff = a - b;
    const { answer, choices } = buildChoices(rng, diff, [smallFromLarge(a, b), diff + 10 ** (d - 1), diff + 100, diff + 10], {
      fill: () => diff + randInt(rng, -9, 9) * 10 ** randInt(rng, 0, 2),
    });
    return {
      prompt: `${fmt(a)} ${MINUS} ${fmt(b)} = ?`,
      answer,
      choices,
      hint: 'You cannot take from 0. Go left to the first digit that is not 0. Regroup, and the zeros become 9s.',
      explain: `Regroup across the zeros (they become 9s). ${fmt(a)} ${MINUS} ${fmt(b)} = ${fmt(diff)}. Check: ${fmt(diff)} + ${fmt(b)} = ${fmt(a)}.`,
    };
  },
};
