// 한 판의 학습 진행 — 스킬 고르기 · 레벨 조정 · 설명 카드 · Star Review 집계
import { makeQuestion, SKILLS } from './skills/index.js';

export class LearningSession {
  constructor(learning, progress, rng = Math.random) {
    this.cfg = learning;
    this.progress = progress;
    this.rng = rng;
    this.levels = {};
    this.streaks = {};
    this.introShown = new Set();
    this.lastSkill = null;
    this.stats = { asked: 0, firstTry: 0, stars: 0, skills: {} };
  }

  levelOf(id) {
    if (!(id in this.levels)) this.levels[id] = this.progress.get(id).level || 1;
    return this.levels[id];
  }

  pickSkill() {
    const { review, preview, ratio } = this.cfg;
    let pool = preview.length === 0 || (review.length && this.rng() < ratio) ? review : preview;
    const asked = (id) => this.stats.skills[id]?.asked ?? 0;
    const fewest = Math.min(...pool.map(asked));
    let choices = pool.filter((id) => asked(id) === fewest && id !== this.lastSkill);
    if (!choices.length) choices = pool.filter((id) => id !== this.lastSkill);
    if (!choices.length) choices = pool;
    return choices[Math.floor(this.rng() * choices.length)];
  }

  // 다음 문제 + (선행 스킬을 처음 만나면) 설명 카드
  next() {
    const id = this.pickSkill();
    this.lastSkill = id;
    const skill = SKILLS[id];
    const question = makeQuestion(id, this.levelOf(id), Math.floor(this.rng() * 2 ** 32));
    let intro = null;
    if (skill.intro && !this.introShown.has(id) && this.progress.get(id).asked === 0) {
      intro = skill.intro;
      this.introShown.add(id);
    }
    return { question, intro, skill };
  }

  // result = 'first' | 'retry' | 'missed'
  report(id, result) {
    const s = (this.stats.skills[id] ??= { asked: 0, firstTry: 0, missed: 0 });
    s.asked++;
    this.stats.asked++;
    if (result === 'first') {
      s.firstTry++;
      this.stats.firstTry++;
      this.streaks[id] = (this.streaks[id] ?? 0) + 1;
      if (this.streaks[id] >= 2) {
        this.levels[id] = Math.min(3, this.levelOf(id) + 1);
        this.streaks[id] = 0;
      }
    } else {
      if (result === 'missed') s.missed++;
      this.levels[id] = Math.max(1, this.levelOf(id) - 1);
      this.streaks[id] = 0;
    }
    if (result !== 'missed') this.stats.stars++;
    this.progress.record(id, result, this.levelOf(id));
  }

  // 연습이 더 필요한 유형 (이번 판에 첫 번에 못 맞힌 것) 최대 n 개
  needsPractice(n = 2) {
    return Object.entries(this.stats.skills)
      .filter(([, s]) => s.firstTry < s.asked)
      .sort((a, b) => a[1].firstTry / a[1].asked - b[1].firstTry / b[1].asked || b[1].missed - a[1].missed)
      .slice(0, n)
      .map(([id]) => SKILLS[id].name);
  }
}
