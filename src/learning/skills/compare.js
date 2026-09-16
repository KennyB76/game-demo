import { digitAt, digitCount, fmt, makeRng, PLACE_NAMES, randInt, randomDigits, shuffle } from '../numbers.js';

// 4.NBT.A.2 — 두 수 비교 (< > =)
export default {
  id: 'compare',
  standard: '4.NBT.A.2',
  chapter: 1,
  name: 'Comparing numbers',
  generate(level, seed) {
    const rng = makeRng(seed);
    const d = [3, 5, 6][level - 1];
    let a;
    let b;
    const r = rng();
    if (level === 3 && r < 0.3) {
      // 자릿수가 다른 함정: 99,xxx vs 10x,xxx
      a = randInt(rng, 90000, 99999);
      b = randInt(rng, 100000, 109999);
    } else if (r > 0.85) {
      a = randomDigits(rng, d);
      b = a;
    } else {
      a = randomDigits(rng, d);
      // 한 자리만 바꾼다 (앞자리는 0 이 되지 않게)
      for (;;) {
        const k = randInt(rng, 0, d - 1);
        const old = digitAt(a, k);
        const nd = randInt(rng, k === d - 1 ? 1 : 0, 9);
        if (nd === old) continue;
        b = a + (nd - old) * 10 ** k;
        break;
      }
    }
    if (rng() < 0.5) [a, b] = [b, a];
    const sign = a < b ? '<' : a > b ? '>' : '=';

    let explain;
    if (a === b) explain = 'Every digit is the same, so they are equal.';
    else if (digitCount(a) !== digitCount(b)) {
      explain = `${fmt(Math.max(a, b))} has more digits, so it is greater. ${fmt(a)} ${sign} ${fmt(b)}.`;
    } else {
      let k = digitCount(a) - 1;
      while (digitAt(a, k) === digitAt(b, k)) k--;
      const da = digitAt(a, k);
      const db = digitAt(b, k);
      explain = `Look at the ${PLACE_NAMES[k]} place: ${da} is ${da > db ? 'greater' : 'less'} than ${db}. So ${fmt(a)} ${sign} ${fmt(b)}.`;
    }
    return {
      prompt: `Which sign makes it true?   ${fmt(a)}  ?  ${fmt(b)}`,
      answer: sign,
      choices: shuffle(rng, ['<', '>', '=']),
      hint: 'Start on the left. Find the first place where the digits are different.',
      explain,
    };
  },
};
