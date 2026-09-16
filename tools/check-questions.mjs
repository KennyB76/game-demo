// 문제 검산 — 모든 스킬 × 레벨 1~3 × 시드 200개.
// 정답은 생성 함수를 믿지 않고 문제 문장을 다시 읽어 따로 계산한다.
// 실행: node tools\check-questions.mjs   (실패 시 exit 1)
import { LEVELS, makeQuestion, SKILLS } from '../src/learning/skills/index.js';

const SEEDS = 200;
const num = (s) => Number(s.replace(/,/g, ''));

const ONES = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

function wordsToNumber(text) {
  let total = 0;
  let group = 0;
  for (const raw of text.trim().split(/\s+/)) {
    for (const w of raw.split('-')) {
      if (w in ONES) group += ONES[w];
      else if (w in TENS) group += TENS[w];
      else if (w === 'hundred') group *= 100;
      else if (w === 'thousand') {
        total += group * 1000;
        group = 0;
      } else return NaN;
    }
  }
  return total + group;
}

// "40,000 + 500 + 6" → 정식 전개식이면 합, 아니면 NaN
function expandedToNumber(text) {
  const terms = text.split(' + ').map(num);
  let last = Infinity;
  let sum = 0;
  for (const t of terms) {
    if (!/^[1-9]0*$/.test(String(t)) || t >= last) return NaN;
    last = t;
    sum += t;
  }
  return sum;
}

function roundHalfUp(n, p) {
  const q = Math.floor(n / p);
  return (n % p) * 2 >= p ? (q + 1) * p : q * p;
}

const PLACE = { ten: 10, hundred: 100, thousand: 1000 };
const N = '([\\d,]+)';

// 스킬마다: 문제 문장 → 기대 정답 값, 선택지 → 값
const CHECKERS = {
  'place-value': {
    expected(p) {
      const m = p.match(new RegExp(`^In ${N}, what is the value of the (\\d)\\?$`));
      if (!m) return undefined;
      const s = m[1].replace(/,/g, '');
      if (s.indexOf(m[2]) !== s.lastIndexOf(m[2]) || s.indexOf(m[2]) < 0) return undefined;
      return Number(m[2]) * 10 ** (s.length - 1 - s.indexOf(m[2]));
    },
    value: num,
  },
  'number-forms': {
    expected(p) {
      let m;
      if ((m = p.match(new RegExp(`^Which shows ${N} in words\\?$`)))) return num(m[1]);
      if ((m = p.match(/^Which number is "([a-z -]+)"\?$/))) return wordsToNumber(m[1]);
      if ((m = p.match(/^Which number is ([\d, +]+)\?$/))) return expandedToNumber(m[1]);
      if ((m = p.match(new RegExp(`^Which is the expanded form of ${N}\\?$`)))) return num(m[1]);
      return undefined;
    },
    value(c) {
      if (/[a-z]/.test(c)) return wordsToNumber(c);
      if (c.includes('+')) return expandedToNumber(c);
      return /^[\d,]+$/.test(c) ? num(c) : NaN;
    },
  },
  compare: {
    expected(p) {
      const m = p.match(new RegExp(`^Which sign makes it true\\?\\s+${N}\\s+\\?\\s+${N}$`));
      if (!m) return undefined;
      const a = num(m[1]);
      const b = num(m[2]);
      return a < b ? '<' : a > b ? '>' : '=';
    },
    value: (c) => c,
  },
  rounding: {
    expected(p) {
      const m = p.match(new RegExp(`^Round ${N} to the nearest (ten|hundred|thousand)\\.$`));
      return m ? roundHalfUp(num(m[1]), PLACE[m[2]]) : undefined;
    },
    value: num,
  },
  'estimate-sum-diff': {
    expected(p) {
      const m = p.match(new RegExp(`^Round each number to the nearest (ten|hundred|thousand)\\. Then estimate:\\s+${N} ([+\\u2212]) ${N}$`));
      if (!m) return undefined;
      const a = roundHalfUp(num(m[2]), PLACE[m[1]]);
      const b = roundHalfUp(num(m[4]), PLACE[m[1]]);
      return m[3] === '+' ? a + b : a - b;
    },
    value: num,
  },
};
const arith = {
  expected(p) {
    const m = p.match(new RegExp(`^${N} ([+\\u2212]) ${N} = \\?$`));
    if (!m) return undefined;
    return m[2] === '+' ? num(m[1]) + num(m[3]) : num(m[1]) - num(m[3]);
  },
  value: num,
};
CHECKERS['add-multi'] = arith;
CHECKERS['subtract-multi'] = arith;
CHECKERS['subtract-across-zeros'] = {
  expected(p) {
    const v = arith.expected(p);
    const top = p.match(/^([\d,]+)/)?.[1].replace(/,/g, '') ?? '';
    return top.slice(1).includes('0') ? v : undefined; // 윗수에 0 자리가 있어야 한다
  },
  value: num,
};

const failures = [];
let total = 0;
const fail = (q, why) => failures.push(`${q.skill} L${q.level} seed ${q.seed}: ${why}\n    prompt: ${q.prompt}\n    answer: ${q.answer} | choices: ${q.choices?.join(' | ')}`);

for (const id of Object.keys(SKILLS)) {
  const ck = CHECKERS[id];
  if (!ck) {
    failures.push(`${id}: no checker`);
    continue;
  }
  for (const level of LEVELS) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      total++;
      let q;
      try {
        q = makeQuestion(id, level, seed);
      } catch (e) {
        failures.push(`${id} L${level} seed ${seed}: threw ${e.message}`);
        continue;
      }
      const again = makeQuestion(id, level, seed);
      if (JSON.stringify(again) !== JSON.stringify(q)) fail(q, 'not deterministic');
      for (const f of ['prompt', 'answer', 'hint', 'explain']) {
        if (typeof q[f] !== 'string' || !q[f] || /undefined|NaN|null/.test(q[f])) fail(q, `bad ${f}`);
      }
      if (!Array.isArray(q.choices) || q.choices.length < 3 || q.choices.length > 4) {
        fail(q, 'need 3-4 choices');
        continue;
      }
      if (new Set(q.choices).size !== q.choices.length) fail(q, 'duplicate choice text');
      if (q.choices.filter((c) => c === q.answer).length !== 1) fail(q, 'answer not in choices exactly once');

      const expected = ck.expected(q.prompt);
      if (expected === undefined || Number.isNaN(expected)) {
        fail(q, 'could not read the prompt');
        continue;
      }
      if (ck.value(q.answer) !== expected) fail(q, `answer is wrong (expected ${expected})`);
      const values = q.choices.map(ck.value);
      if (values.some((v) => Number.isNaN(v))) fail(q, 'a choice cannot be read');
      if (new Set(values).size !== values.length) fail(q, 'two choices have the same value');
      q.choices.forEach((c, i) => {
        if (c !== q.answer && values[i] === expected) fail(q, `wrong choice "${c}" is also correct`);
      });
    }
  }
}

if (failures.length) {
  console.error(failures.slice(0, 30).join('\n'));
  console.error(`\nFAIL — ${failures.length} problem(s) in ${total} questions`);
  process.exit(1);
}
console.log(`OK — ${total} questions (${Object.keys(SKILLS).length} skills x ${LEVELS.length} levels x ${SEEDS} seeds)`);
