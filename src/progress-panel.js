// 타이틀의 "Progress" — 스킬별 정답률 표 + Reset (확인 한 번). 교사가 수업 전에 보는 화면.
import { SKILLS } from './learning/skills/index.js';

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export class ProgressPanel {
  constructor(progress, stage) {
    this.progress = progress;
    this.stage = stage;
    this.el = document.getElementById('screen-progress');
    this.body = document.getElementById('progress-body');
    this.open = false;
    document.getElementById('progress-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.show();
    });
    this.el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'close') this.hide();
      if (act === 'reset') this.render(true);
      if (act === 'reset-no') this.render(false);
      if (act === 'reset-yes') {
        this.progress.reset();
        this.render(false);
      }
    });
  }

  show() {
    this.open = true;
    this.render(false);
    this.el.classList.remove('hidden');
  }

  hide() {
    this.open = false;
    this.el.classList.add('hidden');
  }

  handleKeys(input) {
    if (this.open && input.wasPressed(['Escape'])) this.hide();
  }

  render(confirming) {
    const { review, preview } = this.stage.learning;
    const row = (id, tag) => {
      const s = this.progress.get(id);
      const right = s.firstTry + s.retry;
      const pct = s.asked ? `${Math.round((s.firstTry / s.asked) * 100)}%` : '-';
      return `<tr><td>${esc(SKILLS[id].name)} <span class="tag">${tag}</span></td><td>${esc(SKILLS[id].standard)}</td>
        <td>${s.asked}</td><td>${s.firstTry}</td><td>${right}</td><td>${pct}</td><td>${s.asked ? s.level : '-'}</td></tr>`;
    };
    this.body.innerHTML = `
      <table class="progress-table">
        <thead><tr><th>Skill</th><th>Standard</th><th>Tries</th><th>First try</th><th>Solved</th><th>First-try %</th><th>Level</th></tr></thead>
        <tbody>${review.map((id) => row(id, 'review')).join('')}${preview.map((id) => row(id, 'new')).join('')}</tbody>
      </table>
      <p class="progress-note">Saved only in this browser.</p>
      <div class="progress-actions">
        ${confirming
    ? '<span class="sure">Clear all progress?</span><button data-act="reset-yes" class="btn danger">Yes, clear</button><button data-act="reset-no" class="btn">No</button>'
    : '<button data-act="reset" class="btn">Reset</button><button data-act="close" class="btn primary">Close</button>'}
      </div>`;
  }
}
