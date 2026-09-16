# mochi-2d — 퀴즈 안내 캐릭터 표정 3종

| 항목 | 값 |
|---|---|
| 도구 | Midjourney (웹 · Standard 구독) — Master 가 직접 생성 |
| 캐릭터 참조 | `art-src/mochi/2026-09-16-2d/mochi-ref-v01.png` (Newton School 마스코트 원본에서 잘라낸 것) |
| 참조 방식 | V7 이상 = Omni Reference (`--oref` · 강도 `--ow 100`) · V6 = Character Reference (`--cref` · `--cw 100`) |
| 배경 | 흰 배경으로 뽑고 ImageMagick 으로 투명 처리 (Midjourney 는 투명 배경을 직접 만들지 않는다) |
| 저장 | `art-src/mochi/2026-09-16-2d/mochi-{happy|thinking|oops}-v01.png` |

## 공통 앞부분

```text
cute 3D toy mascot character, pink glossy apple head with a cream peanut-shaped face plate, big teal eyes with white highlights, pink blush cheeks, small brown stem and translucent lavender leaf, small white rounded robot body with lavender wrist bands and a glowing lavender letter N on the chest, floating, soft pastel studio lighting, full body, centered, plain pure white background
```

## 표정별 뒷부분 + 파라미터

happy (정답)

```text
, eyes closed in happy arcs, big open smile, both arms raised cheering, a few tiny sparkles --ar 1:1 --no text, shadow, floor, background objects --oref <참조 이미지> --ow 100
```

thinking (문제 제시)

```text
, finger on chin, looking up curiously, one small sparkle above the head --ar 1:1 --no text, shadow, floor, background objects --oref <참조 이미지> --ow 100
```

oops v02 (v01 은 입 두 개 · 다리 · 신발로 탈락 — 참조를 `mochi-thinking-v01.png` 로 바꿔 몸통 일치)

```text
cute 3D toy mascot character, pink glossy apple head with a cream peanut-shaped face plate, big teal eyes with white highlights, pink blush cheeks, small brown stem and translucent lavender leaf, small white rounded teardrop robot body that floats with no legs and no feet, lavender wrist bands, glowing lavender letter N on the chest, soft pastel studio lighting, full body, centered, plain pure white background, oops expression: eyes wide open with no eyebrows, one small round open mouth only, one hand touching its cheek, a tiny sweat drop beside the head, cute and friendly, not sad --ar 1:1 --no legs, feet, shoes, second mouth, smile line, text, shadow, floor, background objects
```

oops v01 (탈락 · 기록용)

```text
, gentle surprised face with a small open mouth, one hand on cheek, a tiny sweat drop, still cute and friendly --ar 1:1 --no text, shadow, floor, background objects --oref <참조 이미지> --ow 100
```
