# Architecture

## 디렉토리 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # 인증 후 — 페르소나/제품/시뮬 페이지
│   ├── api/                # Server route handlers (Phase 7+)
│   └── layout.tsx, page.tsx
├── components/
│   ├── ui/                 # shadcn/ui generated
│   ├── persona/            # Persona card, drawer, form
│   ├── product/            # Product form, channel cards
│   ├── simulation/         # Life feed, exposure card, timeline, controls
│   ├── interview/          # Drawer, chat UI
│   └── insights/           # Reach chart, Funnel view, Insights cards
├── types/                  # Persona, Product, Exposure, LifeEntry, Funnel, Interview
├── mocks/                  # Fixture data — drives UI in Phase 0-5
├── lib/                    # Helpers (utils, sim driver, retrieval — backend phases)
└── stores/                 # Zustand: simulation clock, active persona
```

## 데이터 모델 (요약)

- **Persona** — UX 리서치 템플릿 8섹션 ([기본 정보] / [목표] / [Pain Point] / [행동 패턴] / [행동 트리거] / [장벽] / [반응하는 메시지] / [기대 경험] / [성공 조건]) + `_sim` 보조 필드 (가족/소득/미디어 습관/브랜드 선호)
- **Product** — 제품 정보 + 채널별 spend plan + 타겟팅 + 크리에이티브
- **Exposure** — 1회 노출 단위 (채널, attention, prior_exposure_count, internal_reasoning, funnel before/after, action)
- **LifeEntry** — 일반 라이프 로그 (일기 + 행동 + 감정 + 지출)
- **FunnelTransition** — persona × product × stage 전환 기록
- **Interview** — 시점 Q&A

자세한 타입은 [src/types/](../src/types/) 참조.

## 시뮬레이션 루프 (Phase 8+)

```
Inngest event "simulation/tick"
  → 페르소나 fan-out
    → step.run: 환경 트리거 → 노출 판정 → 라이프 액션
    → 감정/상태 업데이트 → embedding → DB insert → reflection
  → Supabase Realtime broadcast → UI stream
```

## 구현 Phase

| Phase | 내용 | Part |
|---|---|---|
| 0 | 기반 + 디자인 시스템 | 🎨 UI |
| 1 | 페르소나 생성/카드/리스트 UI | 🎨 UI |
| 2 | 제품/캠페인 입력 UI | 🎨 UI |
| 3 | 시뮬레이션 재생 UI (Life Feed) | 🎨 UI |
| 4 | 시점 인터뷰 drawer UI | 🎨 UI |
| 5 | 인사이트 패널 UI (Reach/Funnel/Insights) | 🎨 UI |
| 6 | Supabase DB 스키마 + 타입 자동 생성 | 🔌 Backend |
| 7 | 페르소나 LLM 생성 (Vercel AI SDK) | 🔌 Backend |
| 8 | 시뮬 엔진 (Mastra + Inngest) | 🔌 Backend |
| 9 | Supabase Realtime 연동 | 🔌 Backend |
| 10 | 인터뷰 retrieval 연동 | 🔌 Backend |
| 11 | 인사이트 LLM narrative | 🔌 Backend |
| 12 | 폴리시 + 출시 | ✨ Polish |
