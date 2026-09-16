// 퀴즈 오버레이 — Magic Recharge · Cloud Gate. 문제는 벌칙이 아니다: 틀려도 목숨은 그대로, 힌트 뒤 다시.
import { LEARN } from './config.js';

const KINDS = {
  recharge: { title: 'Magic Recharge', sub: 'Answer to get a heart back!' },
  gate: { title: 'Cloud Gate', sub: "Break the cloud's shields!" },
};
const NUM_KEYS = [['Digit1', 'Numpad1'], ['Digit2', 'Numpad2'], ['Digit3', 'Numpad3'], ['Digit4', 'Numpad4']];
const GO_KEYS = ['Enter', 'NumpadEnter', 'Space'];

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const STAR = '<svg class="star-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.8l3.1 6.6 7.1.9-5.2 4.9 1.3 7.1L12 17.8l-6.3 3.5 1.3-7.1L1.8 9.3l7.1-.9z"/></svg>';
const SHIELD = '<svg class="shield-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>';

export class Quiz {
  constructor() {
    this.el = document.getElementById('screen-quiz');
    this.card = document.getElementById('quiz-card');
    this.active = false;
    this.timer = null;
    this.card.addEventListener('mousedown', (e) => e.preventDefault()); // 버튼에 포커스가 남아 Space 가 두 번 눌리지 않게
    this.card.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.dataset.choice !== undefined) this.choose(Number(btn.dataset.choice));
      if (btn.dataset.act === 'go') this.go();
    });
  }

  open({ kind, count, session, onCorrect, onDone }) {
    this.close();
    Object.assign(this, { kind, count, session, onCorrect, onDone });
    this.index = 0;
    this.solved = 0;
    this.active = true;
    this.el.classList.remove('hidden');
    this.nextQuestion();
  }

  close() {
    clearTimeout(this.timer);
    this.active = false;
    this.el.classList.add('hidden');
  }

  nextQuestion() {
    if (this.index >= this.count) return this.finish();
    const { question, intro, skill } = this.session.next();
    this.q = question;
    this.skill = skill;
    this.tries = 0;
    this.picked = -1;
    this.choices = question.choices.slice();
    this.phase = intro ? 'intro' : 'ask';
    this.intro = intro;
    this.render();
  }

  choose(i) {
    if (!this.active || this.phase !== 'ask' || i < 0 || i >= this.choices.length) return;
    this.picked = i;
    if (this.choices[i] === this.q.answer) {
      const result = this.tries === 0 ? 'first' : 'retry';
      this.session.report(this.q.skill, result);
      this.solved++;
      this.rewardText = this.onCorrect?.(this.kind);
      this.phase = 'praise';
      this.render();
      this.timer = setTimeout(() => {
        this.index++;
        this.nextQuestion();
      }, LEARN.praiseTime * 1000);
      return;
    }
    this.tries++;
    if (this.tries === 1) {
      this.wrongText = this.choices[i];
      this.choices = reshuffle(this.choices);
      this.picked = -1;
      this.phase = 'retry';
      this.render();
      this.phase = 'ask';
    } else {
      this.session.report(this.q.skill, 'missed');
      this.phase = 'reveal';
      this.render();
    }
  }

  go() {
    if (!this.active) return;
    if (this.phase === 'intro') {
      this.phase = 'ask';
      this.render();
    } else if (this.phase === 'reveal') {
      this.index++;
      this.nextQuestion();
    }
  }

  finish() {
    this.close();
    this.onDone?.();
  }

  handleKeys(input) {
    if (!this.active) return;
    NUM_KEYS.forEach((codes, i) => {
      if (input.wasPressed(codes)) this.choose(i);
    });
    if (input.wasPressed(GO_KEYS)) this.go();
  }

  // ── 그리기 ──────────────────────────────────────────
  render() {
    const k = KINDS[this.kind];
    const head = `
      <div class="quiz-head">
        <div class="quiz-title">${k.title}</div>
        <div class="quiz-sub">${k.sub}</div>
        <div class="quiz-meter">${this.meter()}</div>
      </div>`;
    let body;
    if (this.phase === 'intro') body = this.introHtml();
    else body = this.questionHtml();
    this.card.innerHTML = head + body;
    this.card.classList.remove('bump');
    void this.card.offsetWidth;
    this.card.classList.add('bump');
  }

  meter() {
    if (this.kind === 'gate') {
      return Array.from({ length: this.count }, (_, i) => `<span class="shield ${i < this.solved ? 'broken' : ''}">${SHIELD}</span>`).join('')
        + `<span class="meter-text">Question ${Math.min(this.index + 1, this.count)} of ${this.count}</span>`;
    }
    return Array.from({ length: this.count }, (_, i) => `<span class="dot ${i < this.index ? 'done' : i === this.index ? 'now' : ''}"></span>`).join('')
      + `<span class="meter-text">Question ${Math.min(this.index + 1, this.count)} of ${this.count}</span>`;
  }

  introHtml() {
    const it = this.intro;
    return `
      <div class="intro">
        <div class="intro-tag">New!</div>
        <div class="intro-title">${esc(it.title)}</div>
        <p class="intro-text">${esc(it.text)}</p>
        <div class="intro-example">${esc(it.example)}</div>
        <div><button class="btn primary big" data-act="go">Got it! <kbd>Enter</kbd></button></div>
      </div>`;
  }

  questionHtml() {
    const [ask, math] = this.q.prompt.split(/\s{3,}/);
    const done = this.phase === 'praise' || this.phase === 'reveal';
    const choices = this.choices.map((c, i) => {
      let cls = 'choice';
      if (this.phase === 'praise' && i === this.picked) cls += ' correct';
      if (this.phase === 'reveal') cls += c === this.q.answer ? ' correct' : i === this.picked ? ' wrong' : ' faded';
      if (c.length > 18) cls += ' long';
      return `<button class="${cls}" data-choice="${i}" ${done ? 'disabled' : ''}><span class="num">${i + 1}</span><span class="txt">${esc(c)}</span></button>`;
    }).join('');

    let extra = '';
    if (this.phase === 'retry' || (this.phase === 'ask' && this.tries === 1)) {
      extra = `
        <div class="retry ${this.phase === 'retry' ? 'shake' : ''}">${esc(LEARN.retryText)}</div>
        <div class="hint"><span class="hint-tag">Hint</span> ${esc(this.q.hint)}</div>`;
    } else if (this.phase === 'praise') {
      const praise = LEARN.praise[Math.floor(Math.random() * LEARN.praise.length)];
      const reward = esc(this.rewardText ?? (this.kind === 'gate' ? 'Shield broken!' : '+1 heart'));
      extra = `
        <div class="praise">
          <span class="spark s1">${STAR}</span><span class="spark s2">${STAR}</span><span class="spark s3">${STAR}</span>
          <div class="praise-text">${esc(praise)}</div>
          <div class="reward">${reward} &nbsp; +1 ${STAR}</div>
        </div>`;
    } else if (this.phase === 'reveal') {
      extra = `
        <div class="reveal">
          <div class="reveal-answer">The answer is <b>${esc(this.q.answer)}</b></div>
          <p class="reveal-explain">${esc(this.q.explain)}</p>
          <button class="btn primary big" data-act="go">Next <kbd>Enter</kbd></button>
        </div>`;
    }
    return `
      <div class="question">
        <div class="skill-name">${esc(this.skill.name)}</div>
        <div class="ask">${esc(ask)}</div>
        ${math ? `<div class="math">${esc(math)}</div>` : ''}
      </div>
      <div class="choices ${this.choices.length === 3 ? 'three' : ''}">${choices}</div>
      ${extra}`;
  }
}

function reshuffle(arr) {
  let out = arr;
  for (let t = 0; t < 10; t++) {
    out = arr.slice().sort(() => Math.random() - 0.5);
    if (out.some((c, i) => c !== arr[i])) break;
  }
  return out;
}

export { STAR };
