// 학습 기록 — 이 브라우저 localStorage 에만. 이름 · 개인정보 없음 · 서버 전송 없음.
// 스킬별: asked(푼 문제) · firstTry(첫 번에 맞힘) · retry(힌트 뒤 맞힘) · missed(두 번 틀림) · level(마지막 레벨)
import { LEARN } from '../config.js';

const blank = () => ({ asked: 0, firstTry: 0, retry: 0, missed: 0, level: 1 });

export class Progress {
  constructor(storage = safeStorage()) {
    this.storage = storage;
    this.data = this.load();
  }

  load() {
    try {
      const raw = this.storage?.getItem(LEARN.storageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' && parsed.skills ? parsed : { skills: {} };
    } catch {
      return { skills: {} };
    }
  }

  save() {
    try {
      this.storage?.setItem(LEARN.storageKey, JSON.stringify(this.data));
    } catch {
      // 저장 못 해도 게임은 계속
    }
  }

  get(id) {
    return { ...blank(), ...(this.data.skills[id] ?? {}) };
  }

  // result = 'first' | 'retry' | 'missed'
  record(id, result, level) {
    const s = this.get(id);
    s.asked++;
    s[result === 'first' ? 'firstTry' : result === 'retry' ? 'retry' : 'missed']++;
    s.level = level;
    this.data.skills[id] = s;
    this.save();
  }

  reset() {
    this.data = { skills: {} };
    try {
      this.storage?.removeItem(LEARN.storageKey);
    } catch {
      // 무시
    }
  }
}

function safeStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}
