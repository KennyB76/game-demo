# game-demo — 에이전트 규칙

쿼터뷰 액션 RPG 시연작. 브라우저에서 돌고 웹으로 배포한다. 시연용이며 판매·공개 배포 계획은 없다.

- 문서 집 (lot 헌장 · 보고): `D:\Newton-Homedesktop\Onedrive-newtonschool.io\OneDrive - Newton School LLC\Newton-Onedrive\principia-onedrive\500-WIP\044-Game-Demo\`
- 코드 집 (이 폴더 · git): `C:\Dev\WIP\game-demo\`
- 스택: Three.js + Vite. 실행 `npm run dev` · 빌드 `npm run build` → `dist\`

## 제작 순서 — 그래픽은 마지막

| 버전 태그 | 단계 | 끝나는 조건 |
|---|---|---|
| `v0.1-greybox` | 3D 기본 도형으로 이동 · 공격 · 적 · 보스 | Master가 직접 플레이해 손맛 합격 |
| `v0.2-feel-learn` | 학습 구조 (문제 풀이 · 스테이지 틀 · 학습 기록) + 타격감 · 난이도 다듬기 | Master 플레이 합격 · 문제 정답 검산 통과 |
| `v0.3-art` | 에셋 입히기 (Midjourney · Higgsfield — 2D 스프라이트 · 3D 모델 · 배경) | 쇼룸 검수 통과 에셋만 반영 |
| `v0.4-audio` | 배경음 (Suno) · 효과음 (ElevenLabs) | 장면별 배치 완료 |
| `v1.0-demo` | 웹 배포 | 공개 URL에서 플레이 가능 |

단계를 건너뛰지 않는다. 그래픽 작업은 `v0.2-feel-learn` 태그 전에 시작하지 않는다.

## 학습 구조 원칙

- 대상 = 초등학생. 게임 안 글자는 짧고 쉬운 영어. 실명 · 학교명 · 개인정보를 게임 · 코드 · 커밋 어디에도 넣지 않는다.
- 문제는 교재 문제 · 그림을 옮기지 않는다. 성취기준(CCSS)에 맞춘 생성 함수로 새로 만든다.
- 문제는 벌칙이 아니다. 맞히면 보상, 틀려도 목숨을 잃지 않고 힌트 뒤 다시 푼다.
- 스테이지 하나 = 교재 한 장. 새 스테이지는 액션 코드를 건드리지 않고 스테이지 파일과 문제 생성 함수만 더한다.
- 학습 기록은 브라우저 안(localStorage)에만. 서버 전송 없음.

## 폴더

| 폴더 | 무엇 | git |
|---|---|---|
| `src\` | 게임 코드 | 추적 |
| `public\assets\` | 게임이 실제로 읽는 에셋만 | 추적 (`.glb` `.wav` 등 큰 바이너리는 LFS) |
| `art-src\` | Higgsfield 원본 · 후보 전부 | **제외** |
| `blender\` | `.blend` 작업 파일 | LFS |
| `prompts\` | 에셋별 프롬프트 기록 | 추적 |
| `tools\` | 스프라이트 자르기 · 쇼룸 등 보조 도구 (필요해질 때 만든다) | 추적 |
| `assets.json` | 에셋 장부 | 추적 |
| `dist\` · `node_modules\` | 빌드 결과 · 의존성 | 제외 |

## 이름

- 공백 금지 · 소문자 · 하이픈. `{대상}-{동작}-v{두자리}.{확장자}` — 예: `hero-attack-v03.png`, `slime-hit-v01.png`, `boss-v02.glb`
- 원본 후보 폴더: `art-src\{대상}\{YYYY-MM-DD}-{동작}\`

## 에셋 장부 `assets.json`

게임에 들어간 에셋은 반드시 한 줄씩 등록한다. 원본 이미지는 버려도 되지만 프롬프트 기록은 버리지 않는다.

```json
{ "id": "hero-attack", "file": "public/assets/sprites/hero/hero-attack-v03.png",
  "version": 3, "kind": "sprite-sheet", "tool": "Higgsfield", "model": "GPT Image 2.5",
  "prompt": "prompts/hero-attack.md", "status": "in-game", "date": "2026-09-16" }
```

`status` = `candidate` · `selected` · `in-game` · `retired`

## 버전 관리

- **루프 한 바퀴 전에 반드시 커밋한다.** 망가지면 `git restore` · `git revert`로 되돌린다.
- 실험은 브랜치: `feel/combo`, `art/hero-3d`
- 플레이 가능한 단계마다 태그 (위 표). 타이틀 화면 구석에 현재 버전을 표시한다.
- 커밋 메시지 한 줄 요약 + 무엇을 플레이로 확인했는지.

## 루프 규칙

- 한 바퀴 = 변경 → `npm run dev`로 실제 실행 확인 → 스스로 플레이 판단 → 커밋.
- 조정 수치(속도 · 데미지 · 경직 시간 등)는 한 파일(`src\config.js`)에 모아 바꾸기 쉽게 한다.
- 정해진 바퀴 수를 넘기지 않는다. 끝나면 무엇을 바꿨고 무엇이 남았는지 lot의 `reports\`에 적는다.
- 비용이 드는 생성(Higgsfield 크레딧)은 Master 승인 뒤에만 호출한다.

## 금지

- 원작 IP 캐릭터 · 상표 · 실존 인물 얼굴
- `art-src\` 커밋 · 100MB 넘는 파일 커밋
- lot 문서 집(vault)에 코드 · 에셋 · `node_modules` 두기
