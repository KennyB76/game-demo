// Stage 1 — Flower Meadow. 스테이지 하나 = 교재 한 장.
// 흐름 · 적 구성 · 학습 설정만 담는다. 액션 수치는 src/config.js.
import { BOSS, WAVES } from '../config.js';

export default {
  id: 'stage-01',
  order: 1,
  name: 'Flower Meadow',
  flow: [
    { type: 'wave', ...WAVES.list[0] },
    { type: 'quiz', kind: 'recharge' },
    { type: 'wave', ...WAVES.list[1] },
    { type: 'quiz', kind: 'gate' },
    { type: 'boss', name: BOSS.name },
  ],
  learning: {
    review: ['place-value', 'number-forms', 'compare', 'rounding'], // Ch1 복습
    preview: ['estimate-sum-diff', 'add-multi', 'subtract-multi', 'subtract-across-zeros'], // Ch2 선행
    ratio: 0.7, // 복습 비율
    recharge: 2, // Magic Recharge 문제 수
    gate: 3, // Cloud Gate 문제 수 = 보스 방어막 겹 수
  },
};
