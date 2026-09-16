import { buildChoices, fmt, makeRng, MINUS, randInt, randomDigits, ROUND_WORDS, roundTo } from '../numbers.js';

// 4.NBT.A.3 + 4.NBT.B.4 — 반올림해서 합 · 차 어림하기 (Ch2 선행)
export default {
  id: 'estimate-sum-diff',
  standard: '4.NBT.A.3',
  chapter: 2,
  name: 'Estimating sums and differences',
  intro: {
    title: 'Estimate',
    text: 'Round each number first. Then add or subtract the easy numbers.',
    example: `48 + 31  →  50 + 30 = 80`,
  },
  generate(level, seed) {
    const rng = makeRng(seed);
    const d = [2, 3, 4][level - 1];
    const place = 10 ** (d - 1);
    const add = rng() < 0.5;
    let a;
    let b;
    for (;;) {
      a = randomDigits(rng, d);
      b = randomDigits(rng, d);
      if (a % place === 0 || b % place === 0) continue;
      if (!add && a < b) [a, b] = [b, a];
      if (!add && roundTo(a, place) <= roundTo(b, place)) continue;
      break;
    }
    const ra = roundTo(a, place);
    const rb = roundTo(b, place);
    const op = add ? '+' : MINUS;
    const calc = (x, y) => (add ? x + y : x - y);
    const ans = calc(ra, rb);
    const word = ROUND_WORDS[place];
    const { answer, choices } = buildChoices(rng, ans, [calc(a, b), calc(ra + place, rb), calc(ra, rb + place), calc(ra - place, rb), calc(roundTo(a, place * 10), roundTo(b, place * 10))], {
      fill: () => ans + randInt(rng, -3, 3) * place,
    });
    return {
      prompt: `Round each number to the nearest ${word}. Then estimate:   ${fmt(a)} ${op} ${fmt(b)}`,
      answer,
      choices,
      hint: `Round ${fmt(a)} and ${fmt(b)} to the nearest ${word} first. Then ${add ? 'add' : 'subtract'}.`,
      explain: `${fmt(a)} rounds to ${fmt(ra)}. ${fmt(b)} rounds to ${fmt(rb)}. ${fmt(ra)} ${op} ${fmt(rb)} = ${fmt(ans)}.`,
    };
  },
};
