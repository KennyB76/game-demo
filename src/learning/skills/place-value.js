import { buildChoices, fmt, makeRng, PLACE_NAMES, randInt, randomDigits } from '../numbers.js';

// 4.NBT.A.1 — 자리값: 수 안의 한 숫자가 나타내는 값
export default {
  id: 'place-value',
  standard: '4.NBT.A.1',
  chapter: 1,
  name: 'Place value',
  generate(level, seed) {
    const rng = makeRng(seed);
    const d = [4, 5, 6][level - 1];
    let n;
    let k;
    for (;;) {
      n = randomDigits(rng, d);
      const s = String(n);
      // 한 번만 나오는 0 아닌 숫자 중에서 고른다 ("the 4" 가 하나로 정해지게)
      const ok = [];
      for (let i = 0; i < s.length; i++) {
        if (s[i] !== '0' && s.indexOf(s[i]) === s.lastIndexOf(s[i])) ok.push(s.length - 1 - i);
      }
      if (ok.length) {
        k = ok[randInt(rng, 0, ok.length - 1)];
        break;
      }
    }
    const digit = Math.floor(n / 10 ** k) % 10;
    const value = digit * 10 ** k;
    const { answer, choices } = buildChoices(rng, value, [digit, digit * 10 ** (k + 1), k > 0 ? digit * 10 ** (k - 1) : null, digit * 10 ** (k + 2)], {
      fill: () => digit * 10 ** randInt(rng, 0, d),
    });
    return {
      prompt: `In ${fmt(n)}, what is the value of the ${digit}?`,
      answer,
      choices,
      hint: `Find the ${digit}. Name its place: ones, tens, hundreds, thousands...`,
      explain: k === 0
        ? `The ${digit} is in the ones place. It is worth ${digit}.`
        : `The ${digit} is in the ${PLACE_NAMES[k]} place. ${digit} × ${fmt(10 ** k)} = ${fmt(value)}.`,
    };
  },
};
