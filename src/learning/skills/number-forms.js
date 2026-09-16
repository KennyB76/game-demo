import { buildChoices, fmt, makeRng, pickOne, randInt, shuffle, toExpanded, toWords } from '../numbers.js';

// 4.NBT.A.2 — 수 읽기 · 쓰기: 숫자 ↔ 단어 ↔ 전개식 (0 자리 포함)
function withZeros(rng, d, zeros) {
  const zeroPos = shuffle(rng, Array.from({ length: d - 1 }, (_, i) => i + 1)).slice(0, zeros);
  let s = '';
  for (let i = 0; i < d; i++) s += zeroPos.includes(i) ? '0' : String(randInt(rng, 1, 9));
  return Number(s);
}

// 0 자리를 잘못 다룬 수들 — 가장 흔한 실수
function zeroMistakes(n) {
  const s = String(n);
  const out = [];
  const add = (t) => {
    if (t && t[0] !== '0' && t.length <= 6 && Number(t) !== n) out.push(Number(t));
  };
  const firstZero = s.indexOf('0');
  if (firstZero > 0) add(s.slice(0, firstZero) + s.slice(firstZero + 1)); // 0 빠뜨림
  if (firstZero > 0) add(s.slice(0, firstZero) + '0' + s.slice(firstZero)); // 0 하나 더
  for (let i = 1; i < s.length; i++) {
    if (s[i] === '0' && i + 1 < s.length && s[i + 1] !== '0') add(s.slice(0, i) + s[i + 1] + '0' + s.slice(i + 2)); // 0 을 뒤로
    if (s[i] === '0' && s[i - 1] !== '0' && i - 1 > 0) add(s.slice(0, i - 1) + '0' + s[i - 1] + s.slice(i + 1)); // 0 을 앞으로
  }
  add(s + '0');
  return out;
}

export default {
  id: 'number-forms',
  standard: '4.NBT.A.2',
  chapter: 1,
  name: 'Number names and forms',
  generate(level, seed) {
    const rng = makeRng(seed);
    const [d, zeros] = [[4, 1], [5, 1], [6, 2]][level - 1];
    const n = withZeros(rng, d, zeros);
    const mistakes = zeroMistakes(n).filter((m) => m <= 999999);
    const fill = () => withZeros(rng, d, zeros);
    const mode = pickOne(rng, ['to-words', 'from-words', 'from-expanded', 'to-expanded']);
    const hint = 'Look for the zeros. A zero holds a place but adds nothing.';

    if (mode === 'to-words') {
      const { answer, choices } = buildChoices(rng, n, mistakes, { format: toWords, fill });
      return { prompt: `Which shows ${fmt(n)} in words?`, answer, choices, hint, explain: `${fmt(n)} is read "${toWords(n)}".` };
    }
    if (mode === 'from-words') {
      const { answer, choices } = buildChoices(rng, n, mistakes, { fill });
      return { prompt: `Which number is "${toWords(n)}"?`, answer, choices, hint, explain: `"${toWords(n)}" is written ${fmt(n)}.` };
    }
    if (mode === 'from-expanded') {
      const { answer, choices } = buildChoices(rng, n, mistakes, { fill });
      return { prompt: `Which number is ${toExpanded(n)}?`, answer, choices, hint, explain: `${toExpanded(n)} = ${fmt(n)}. Empty places get a 0.` };
    }
    const { answer, choices } = buildChoices(rng, n, mistakes, { format: toExpanded, fill });
    return { prompt: `Which is the expanded form of ${fmt(n)}?`, answer, choices, hint, explain: `${fmt(n)} = ${toExpanded(n)}. We skip the zeros.` };
  },
};
