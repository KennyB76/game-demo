import { buildChoices, digitAt, fmt, makeRng, randInt, randomDigits, ROUND_WORDS, roundTo } from '../numbers.js';

// 4.NBT.A.3 — 가장 가까운 10 · 100 · 1,000 으로 반올림
export default {
  id: 'rounding',
  standard: '4.NBT.A.3',
  chapter: 1,
  name: 'Rounding',
  generate(level, seed) {
    const rng = makeRng(seed);
    const place = [10, 100, 1000][level - 1];
    const k = Math.log10(place);
    let n;
    for (;;) {
      const d = level === 3 ? randInt(rng, 5, 6) : [3, 4][level - 1];
      n = randomDigits(rng, d);
      const trick = rng();
      if (trick < 0.3) n = n - digitAt(n, k - 1) * 10 ** (k - 1) + 5 * 10 ** (k - 1); // 바로 오른쪽이 5
      else if (trick < 0.5) n = n - (n % (place * 10)) + 9 * place + randInt(rng, 5, 9) * 10 ** (k - 1); // 9 에서 올림
      if (n % place !== 0 && n < 1000000) break;
    }
    const ans = roundTo(n, place);
    const down = Math.floor(n / place) * place;
    const other = ans === down ? down + place : down;
    const next = digitAt(n, k - 1);
    const word = ROUND_WORDS[place];
    const { answer, choices } = buildChoices(rng, ans, [other, roundTo(n, place * 10), place > 10 ? roundTo(n, place / 10) : n, ans + place * 10], {
      fill: () => ans + randInt(rng, -3, 3) * place,
    });
    return {
      prompt: `Round ${fmt(n)} to the nearest ${word}.`,
      answer,
      choices,
      hint: `Look at the digit just right of the ${word}s place. 5 or more: round up. Less than 5: round down.`,
      explain: `The digit after the ${word}s place is ${next}. ${next >= 5 ? '5 or more, so round up' : 'Less than 5, so round down'}: ${fmt(ans)}.`,
    };
  },
};
