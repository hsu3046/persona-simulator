# Project Memory

## 결정

- **2026-05-16** — UI-first → Backend 순서로 진행. TS 타입을 Phase 0 에서 확정해 UI mock 과 backend 모두 동일 타입 사용
- **2026-05-16** — 페르소나 표현 구조는 UX 리서치 표준 템플릿 ([기본정보] / [목표] / [Pain Point] / [행동패턴] / [행동트리거] / [장벽] / [반응하는메시지] / [기대경험] / [성공조건]) 채택. 시뮬 계산용 필드는 `_sim` 네임스페이스 분리
- **2026-05-16** — 아이콘 Phosphor 채택 (Lucide 대신). 6 weights 동적 변경으로 감정 표현
- **2026-05-16** — 캐릭터 애니메이션 Rive 채택 (Lottie 대신). 60fps + state machine
- **2026-05-16** — AI 에이전트는 Mastra + Vercel AI SDK 병행. Inngest 로 시뮬 tick 이벤트 fan-out
