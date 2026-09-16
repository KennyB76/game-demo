// 스킬 등록부 — 새 기준은 생성 함수 파일 하나 + 여기 한 줄.
import addMulti from './add-multi.js';
import compare from './compare.js';
import estimateSumDiff from './estimate-sum-diff.js';
import numberForms from './number-forms.js';
import placeValue from './place-value.js';
import rounding from './rounding.js';
import subtractAcrossZeros from './subtract-across-zeros.js';
import subtractMulti from './subtract-multi.js';

export const SKILLS = Object.fromEntries(
  [placeValue, numberForms, compare, rounding, estimateSumDiff, addMulti, subtractMulti, subtractAcrossZeros].map((s) => [s.id, s]),
);

export const LEVELS = [1, 2, 3];

// 결정적 시드 → 문제 하나. 같은 (skill, level, seed) 는 언제나 같은 문제.
export function makeQuestion(skillId, level, seed) {
  const skill = SKILLS[skillId];
  if (!skill) throw new Error(`unknown skill: ${skillId}`);
  return { skill: skillId, level, seed, ...skill.generate(level, seed >>> 0) };
}
