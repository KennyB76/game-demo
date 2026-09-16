import { BOSS, CSS_COLORS, FEEL, VERSION } from './config.js';
import { STAR } from './quiz.js';
import { pick } from './util.js';

const HEART_SVG = '<svg viewBox="0 0 32 29" aria-hidden="true"><path d="M16 28 C 6 20 0 14 0 8 C 0 3 4 0 8.5 0 C 12 0 14.5 2 16 4.5 C 17.5 2 20 0 23.5 0 C 28 0 32 3 32 8 C 32 14 26 20 16 28 Z"/></svg>';

export class Hud {
  constructor() {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(CSS_COLORS)) {
      if (typeof v === 'string') root.style.setProperty(`--${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}`, v);
    }
    this.hearts = document.getElementById('hearts');
    this.wave = document.getElementById('wave');
    this.bossBar = document.getElementById('boss-bar');
    this.bossFill = document.getElementById('boss-fill');
    this.bossShield = document.getElementById('boss-shield');
    this.bossShields = document.getElementById('boss-shields');
    this.stars = document.getElementById('stars');
    this.starCount = document.getElementById('star-count');
    document.getElementById('star-icon').innerHTML = STAR;
    this.review = document.getElementById('review-card');
    this.banner = document.getElementById('banner');
    this.numbers = document.getElementById('numbers');
    this.confetti = document.getElementById('confetti');
    this.screens = {
      title: document.getElementById('screen-title'),
      over: document.getElementById('screen-over'),
      clear: document.getElementById('screen-clear'),
      review: document.getElementById('screen-review'),
    };
    this.hudEl = document.getElementById('hud');
    document.getElementById('boss-name').textContent = BOSS.name;
    for (const el of document.querySelectorAll('.version')) el.textContent = VERSION;
    this.heartCount = -1;
  }

  setHearts(n, max, hurt = false) {
    if (this.heartCount !== max || this.hearts.children.length !== max) {
      this.hearts.innerHTML = '';
      for (let i = 0; i < max; i++) {
        const h = document.createElement('div');
        h.className = 'heart';
        h.innerHTML = HEART_SVG;
        this.hearts.appendChild(h);
      }
      this.heartCount = max;
    }
    [...this.hearts.children].forEach((h, i) => {
      const was = h.classList.contains('full');
      h.classList.toggle('full', i < n);
      if (hurt && was && i >= n) {
        h.classList.remove('lost');
        void h.offsetWidth;
        h.classList.add('lost');
      }
    });
  }

  setWave(text) {
    this.wave.textContent = text;
    this.wave.classList.remove('bump');
    void this.wave.offsetWidth;
    this.wave.classList.add('bump');
  }

  showBossBar(on) {
    this.bossBar.classList.toggle('hidden', !on);
  }

  // hp 중 base 를 넘는 부분 = 방어막 보너스 (보라)
  setBossHp(hp, base = hp, max = hp || 1) {
    this.bossFill.style.width = `${(Math.max(0, Math.min(hp, base)) / max) * 100}%`;
    this.bossShield.style.width = `${(Math.max(0, hp - base) / max) * 100}%`;
  }

  setBossShields(n) {
    this.bossShields.textContent = n > 0 ? `${n} shield${n > 1 ? 's' : ''}` : '';
  }

  setStars(n, bump = false) {
    this.starCount.textContent = String(n);
    if (bump) {
      this.stars.classList.remove('bump');
      void this.stars.offsetWidth;
      this.stars.classList.add('bump');
    }
  }

  showReview({ stars, asked, firstTry, practice }) {
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    let learn;
    if (asked === 0) learn = '<p class="rv-line">No questions this time.</p>';
    else if (practice.length === 0) learn = `<p class="rv-line">You got all <b>${asked}</b> right on the first try!</p><p class="rv-super">Super star!</p>`;
    else {
      learn = `<p class="rv-line">You got <b>${firstTry}</b> of <b>${asked}</b> right on the first try!</p>
        <div class="rv-practice"><div class="rv-label">Let's practice:</div>${practice.map((p) => `<div class="rv-skill">${esc(p)}</div>`).join('')}</div>`;
    }
    this.review.innerHTML = `
      <h2 class="rv-title">Star Review</h2>
      <div class="rv-stars">${STAR}<span>&times; ${stars}</span></div>
      ${learn}
      <p class="rv-again">Play again <kbd>R</kbd></p>`;
    this.showScreen('review');
  }

  showBanner(text) {
    this.banner.textContent = text;
    this.banner.classList.remove('show');
    void this.banner.offsetWidth;
    this.banner.classList.add('show');
  }

  showScreen(name) {
    for (const [k, el] of Object.entries(this.screens)) el.classList.toggle('hidden', k !== name);
    this.hudEl.classList.toggle('hidden', name === 'title');
  }

  burstConfetti() {
    this.clearConfetti();
    for (let i = 0; i < FEEL.confettiCount; i++) {
      const c = document.createElement('i');
      c.style.setProperty('--x', `${Math.random() * 100}vw`);
      c.style.setProperty('--drift', `${(Math.random() - 0.5) * 30}vw`);
      c.style.setProperty('--spin', `${(Math.random() - 0.5) * 1440}deg`);
      c.style.setProperty('--dur', `${2.4 + Math.random() * 2.4}s`);
      c.style.setProperty('--delay', `${Math.random() * 1.2}s`);
      c.style.background = pick(CSS_COLORS.confetti);
      if (Math.random() < 0.35) c.classList.add('round');
      this.confetti.appendChild(c);
    }
  }

  clearConfetti() {
    this.confetti.innerHTML = '';
  }
}
