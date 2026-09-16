// Mochi — 퀴즈 안내 캐릭터. CSS background-position + steps() 로 스프라이트 시트를 돌린다 (Three.js 아님).
// 이미지가 안 뜨면 자리만 비워 두고 카드는 그대로.
import { MOCHI } from './config.js';

const status = {}; // file → 'ok' | 'missing'

function sheetUrl(file) {
  return `${import.meta.env.BASE_URL}${MOCHI.dir}${file}`;
}

function preload(file, onDone) {
  if (status[file]) return onDone(status[file]);
  const img = new Image();
  img.onload = () => onDone((status[file] = 'ok'));
  img.onerror = () => onDone((status[file] = 'missing'));
  img.src = sheetUrl(file);
}

export class Mochi {
  constructor(slot) {
    this.el = document.createElement('div');
    this.el.className = 'mochi';
    this.el.style.setProperty('--mochi-size', `${MOCHI.size}px`);
    this.el.style.setProperty('--mochi-size-narrow', `${MOCHI.sizeNarrow}px`);
    this.bubble = document.createElement('div');
    this.bubble.className = 'mochi-bubble';
    this.sprite = document.createElement('div');
    this.sprite.className = 'mochi-sprite';
    this.sprite.setAttribute('aria-hidden', 'true');
    this.el.append(this.bubble, this.sprite);
    slot.appendChild(this.el);
    this.state = null;
    this.token = 0;
    this.sprite.addEventListener('animationend', () => {
      const next = this.after;
      this.after = null;
      if (next) this.play(next);
    });
    for (const s of Object.values(MOCHI.sheets)) preload(s.file, () => {});
  }

  say(text) {
    this.bubble.textContent = text;
    this.bubble.classList.toggle('empty', !text);
    this.bubble.classList.remove('pop');
    void this.bubble.offsetWidth;
    this.bubble.classList.add('pop');
  }

  // loops = 0 → 무한 반복, then = 끝난 뒤 이어갈 상태
  play(state, { loops = 0, then = null } = {}) {
    const sheet = MOCHI.sheets[state];
    if (!sheet) return;
    this.state = state;
    this.after = loops > 0 ? then : null;
    const token = ++this.token;
    preload(sheet.file, (st) => {
      if (token !== this.token) return;
      const s = this.sprite;
      if (st === 'missing') {
        s.classList.add('missing');
        s.style.animation = 'none';
        s.style.backgroundImage = 'none';
        if (this.after) {
          const next = this.after;
          this.after = null;
          this.play(next);
        }
        return;
      }
      s.classList.remove('missing');
      s.style.setProperty('--frames', sheet.frames);
      s.style.backgroundImage = `url("${sheetUrl(sheet.file)}")`;
      s.style.animation = 'none';
      void s.offsetWidth;
      const dur = sheet.frames / sheet.fps;
      s.style.animation = `mochi-play ${dur}s steps(${sheet.frames}) ${loops > 0 ? loops : 'infinite'}`;
    });
  }
}
