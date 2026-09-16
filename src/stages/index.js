// stage-*.js 를 자동으로 모은다 — 새 스테이지는 파일 하나만 추가.
// 고르기: 주소 ?stage=stage-02 , 없으면 order 가 가장 앞선 스테이지.
const modules = import.meta.glob('./stage-*.js', { eager: true });

export const STAGES = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.order - b.order);

export function currentStage() {
  let wanted = null;
  try {
    wanted = new URLSearchParams(window.location.search).get('stage');
  } catch {
    wanted = null;
  }
  return STAGES.find((s) => s.id === wanted) ?? STAGES[0];
}
