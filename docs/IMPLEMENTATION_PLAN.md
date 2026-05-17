# 구현 계획 (Implementation Plan)

> **최종 업데이트**: 2026-05-17
> **현재 위치**: Phase 0–5 UI 완료 + Phase 7 (BYOK LLM) 완료 + 마케팅·심리 grounding "Medium" 스코프 완료 + 인터뷰 LLM 연동 완료
> **다음 우선순위**: 회귀 검증 → MTA 시각화 → Phase 6 Supabase 백엔드

이 문서는 plan 파일 (`~/.claude/plans/cozy-skipping-reef.md`) 의 요약 + 현재 진척 상태 + 앞으로의 액션 아이템.

---

## 1. 컨셉 한 줄

> "Delve AI 의 비즈니스 가치 (마케팅 인사이트) + Stanford Smallville 의 비주얼 (게임형 라이프 재생) = AI 페르소나 라이프 시뮬레이터"

마케터가 페르소나 + 제품 + 캠페인 plan 을 입력하면, 페르소나가 시뮬레이션 시간 동안 광고에 노출·반응·funnel 진전하는 과정을 일기/행동 로그로 재생. 특정 시점 정지하고 페르소나와 인터뷰 가능. 노출/funnel/인사이트 패널로 마케팅 의사결정 보조.

---

## 2. 진행 상태 — Phase 별

| Phase | 내용 | 상태 | 비고 |
|---|---|---|---|
| 0 | 기반·디자인 시스템 (Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + Phosphor + Motion + Rive) | ✅ | |
| 1 | 페르소나 생성·카드·리스트 UI + 상세 sheet | ✅ | grounding 필드 (Cialdini/MA/cognitive) 디스플레이 포함 |
| 2 | 제품·캠페인 입력 UI (USP·경쟁·채널 plan·DBA) | ✅ | Byron Sharp DBA 5필드 입력 완료 |
| 3 | 시뮬레이션 재생 UI (Life Feed + 헤더 + 진행바) | ✅ | |
| 4 | 시점 인터뷰 drawer UI | ✅ | mock + 실제 LLM 폴백 구조 |
| 5 | 인사이트 패널 (Reach / Funnel / Insight) | ✅ | MTA 비교 인사이트 포함 |
| 6 | **Supabase DB + 타입 자동 생성** | ⏳ | 현재 Zustand persist (브라우저 IndexedDB). 다음 우선 |
| 7 | 페르소나 LLM 생성 (BYOK 4 provider) | ✅ | OpenRouter / OpenAI / Anthropic / Google. dreamfulness 패턴 이식 |
| 8 | 시뮬 엔진 (Mastra + Inngest) | ⚠ | **간략 버전 완료** — Edge route + planner + LLM narrative. Inngest fan-out 은 미적용 (개인 사용 OK, 다중 사용자 시 도입) |
| 9 | Supabase Realtime 연동 | ⏳ | Phase 6 의존 |
| 10 | 인터뷰 retrieval (실제 LLM) | ✅ | 키워드+recency retrieval. pgvector 는 Phase 6 후 |
| 11 | 인사이트 LLM narrative | ⚠ | 룰 기반 + 학문 인용. LLM 종료 후 batch 분석은 Phase 6 후 |
| 12 | 폴리시 + 출시 | ⏳ | |

추가 작업 (plan 의 §9 grounding):
| 작업 | 상태 |
|---|---|
| Marketing engine (frequency·attention·cialdini·MA·forgetting·MTA) | ✅ |
| Planner 통합 (deterministic outcome → LLM narrative) | ✅ |
| McKinsey CDJ 5-stage + Loyalty Loop 매핑 | ✅ |
| 인사이트 진단 카드 (MA blocker / MTA 비교 / 표본 disclaimer) | ✅ |
| 페르소나 prompt grounding 필드 작성 가이드 | ✅ |

---

## 3. 다음 우선순위 — 실행 순서

### 🔥 P0 — 즉시 (1-3일)

#### P0-1. 회귀 검증 시나리오 (사용자 액션)
**목표**: grounding 이 마케터 의사결정에 쓸만한 결과 내는지 정성 검증.

**4 가설** (자세한 설계는 § 7 참조):
- **A**: Mental Availability gate 가 funnel 진전을 막는가
- **B**: Krugman frequency lift S-curve 가 3-5회차에 가속, 8회+ plateau 인가
- **C**: Cialdini multiplier 가 페르소나별 susceptibility 와 일관되게 작용하는가
- **D**: Forgetting curve (half-life 2일) 가 7d / 30d 시뮬에서 effective exposure 를 자연 감쇠하는가

각 가설마다 페어 시뮬 → 결과 비교 → 합격 / 불합격 / 점수 함수 weight 조정.

#### P0-2. MTA 시각화 (텍스트 → 차트)
현재 [src/lib/insights.ts](../src/lib/insights.ts) 의 `computeMtaComparisonInsight()` 는 narrative 텍스트. 마케터가 채널 attribution 모델 차이 (last/first/linear/time-decay) 를 직관 파악하려면 **그룹 막대그래프** 필요.

- 위치: [src/components/simulation/insights-cards.tsx](../src/components/simulation/insights-cards.tsx) 의 MTA 카드
- shadcn Chart `<BarChart>` + 4 색 (모델별) × N 채널 그룹
- 모델 간 합의 / 불일치 표시 (e.g., 같은 채널이 last 에선 1위, first 에선 3위)

#### P0-3. 인터뷰 응답 streaming
현재는 non-streaming. 사용자가 "생각 중…" 스피너 보고 5-15초 대기.

옵션:
- (a) Vercel AI SDK 도입 + `streamText` — 라이브러리 추가
- (b) 직접 SSE — `provider.askStream()` 추가하여 4개 provider 구현. 작업량 큼
- (c) Skip — 현재 spinner UX 로 충분히 수용 가능

**추천**: 마지막 손길로 미룸 (P3).

---

### 🟡 P1 — 다음 1-2주 (실제 SaaS 화 진입)

#### P1-1. Supabase 백엔드 도입 (Phase 6, 9, 11 의존성 해소)

현재 모든 데이터가 Zustand persist (브라우저 localStorage / IndexedDB). 다중 디바이스·공유·장기 보관·배치 분석 불가.

**작업 분해**:
1. **스키마 정의** — `personas`, `products`, `simulations`, `feed_entries` (life + exposure + funnel union), `interview_messages`
2. **pgvector** extension + embedding column (1536 dim) — life entries + exposures
3. **RLS** — read 본인 데이터만 / 쓰기는 admin client only ([CLAUDE.md gotcha](#) 참조)
4. **Migration** — `mcp__supabase__apply_migration`
5. **타입 생성** — `mcp__supabase__generate_typescript_types` → 현재 `src/types/` 와 diff 매핑
6. **Zustand → Supabase 동기화 레이어** — write-through 우선, optimistic update
7. **API routes** — `/api/personas`, `/api/products`, `/api/sim/save`, `/api/sim/load`
8. **Realtime** — `feed_entries` 변경 시 UI broadcast (현재 Zustand append → Supabase insert → realtime subscribe)

리스크: 기존 Zustand 기반 코드 broad 영향. **하지만 read 우선 + 점진 마이그레이션 가능**: 처음엔 Supabase = 저장소 only, UI 는 여전히 Zustand. 시뮬 종료 시 batch save / 시작 시 load.

#### P1-2. 인증 (Supabase Auth)
- Email magic link + Google OAuth
- `auth.uid()` 기반 RLS
- Free tier 한도 (페르소나 3개 / 1일 시뮬 등)

#### P1-3. 모바일 반응형
- 좌측 PersonaTabs → 모바일에서 horizontal scroll 자동 (이미 됨)
- 우측 InsightsPanel → 모바일에서 bottom drawer or 별도 페이지
- iOS 16px font-size 가이드라인 적용 (이미 globals.css)

---

### 🟢 P2 — 다음 2-4주 (가치 검증 깊이화)

#### P2-1. Counterfactual baseline
**문제**: 현재 인사이트는 "광고 본 후 funnel 진전" 만 측정. "광고 없으면 어차피 안 산다" / "광고 없어도 자발적으로 찾아본다" 의 baseline 부재 → 광고 효과 과대평가.

**해결**:
- 같은 페르소나 × 같은 시간으로 **무광고 시뮬** 동시 실행
- 두 시뮬 의 funnel·exposure·purchase 차이 = 광고의 incremental lift
- UI: "광고 효과" 카드에 raw 진전 + 광고 차감 lift 두 숫자 표시

#### P2-2. Monte Carlo 다중 시뮬
**문제**: LLM stochasticity + planner 의 jitter 때문에 같은 입력도 다른 결과. 1회 시뮬 = 운빨.

**해결**:
- 같은 페르소나·제품으로 N회 (5-20) 시뮬
- 결과 분포 (box plot / violin) 표시
- 평균 + std 로 "이 채널이 95% 신뢰구간 [X-Y]% funnel 진전 견인"

리스크: LLM 비용 N배. **BYOK 환경에선 사용자 책임**.

#### P2-3. 인터뷰 응답 streaming (P0-3 미뤘던 것)

---

### 🔵 P3 — Phase 12 폴리시 + 출시

- 온보딩 튜토리얼 (3 step: 페르소나 → 제품 → 시뮬)
- 가격제 (구독 / 시뮬 크레딧)
- 공유 OG image 자동 생성 (시뮬 결과 카드)
- 다국어 (영문 — 글로벌 시장)
- Howler.js SFX (옵션 토글)

---

## 4. 데이터 모델 — 현재 vs Phase 6 후

### 현재 (Zustand persist)
```
useSimStore (시뮬 시간/상태/feed/funnel)
usePersonaStore (페르소나 목록)
useProductStore (제품 목록)
useInterviewStore (인터뷰 메시지/highlight)
useAiSettingsStore (BYOK key/model)
```

### Phase 6 후 (Supabase + Zustand hybrid)
- **read** — Supabase → Zustand cache (mount 시)
- **write** — Zustand mutate + Supabase upsert (debounced)
- **realtime** — Supabase subscribe → Zustand merge
- **offline** — Zustand persist 로 fallback (PWA later)

---

## 5. 핵심 모듈 책임 분리

| 모듈 | 책임 | 확장 시 주의 |
|---|---|---|
| [marketing-engine.ts](../src/lib/marketing-engine.ts) | Deterministic scoring (frequency·attention·cialdini·MA·MTA·CDJ) | LLM 호출 없음. 순수 함수. 캐싱 가능 |
| [sim-day-planner.ts](../src/lib/sim-day-planner.ts) | 시뮬 outcome 계획 (시간 grid + 노출 sequence + funnel delta) | LLM 호출 없음. seed 기반 deterministic |
| [sim-day-prompt.ts](../src/lib/sim-day-prompt.ts) | LLM 에 narrative-only 요청 prompt | planner 결정한 outcome 을 input 으로 받음. 자유 의사결정 X |
| [insights.ts](../src/lib/insights.ts) | feed 집계 → 인사이트 카드 생성 | 룰 기반. LLM 호출 추가 시 Phase 11 |
| [interview-prompt.ts](../src/lib/interview-prompt.ts) | 인터뷰 LLM prompt + Zod schema | retrieval 은 [interview-retrieval.ts](../src/lib/interview-retrieval.ts) 분리 |
| [persona-prompt.ts](../src/lib/persona-prompt.ts) | 페르소나 생성 LLM prompt + grounding 필드 가이드 | schema 의 `.catch()` default 로 LLM 누락 방어 |

---

## 6. 마케팅·심리 grounding — 채택한 이론

| 영역 | 이론 | 적용 위치 |
|---|---|---|
| Funnel | McKinsey CDJ 5단계 + Loyalty Loop | [marketing-engine.ts](../src/lib/marketing-engine.ts) `toCdjPhase()` |
| Frequency | Krugman 3-hit / Ephron Recency / Burton bombardment | `frequencyLift()` S-curve |
| Forgetting | Ebbinghaus | `adRetention()` + `effectiveExposureCount()` (half-life 2일) |
| Processing route | Petty-Cacioppo ELM / Chaiken HSM | `cognitive_processing_default` system1/system2 톤 분리 |
| Mental Availability | Byron Sharp / Ehrenberg-Bass | `mentalAvailabilityGate()` + `dbaContributionPerExposure()` |
| 영향력 | Cialdini 6원리 | `cialdiniMultiplier()` |
| 의사결정 | Kahneman System 1/2 | narrative 톤 가이드 in prompt |
| Attribution | Last/First/Linear/Time-decay MTA | `computeAttribution()` |

자세한 결정 근거: plan §9.

---

## 7. 회귀 검증 시나리오 — 상세

### 가설 A — MA gate
| | 입력 | 예상 결과 |
|---|---|---|
| A1 | 페르소나에 우리 카테고리 MA 0.5+ | gate 통과. funnel 정상 진전 |
| A2 | 페르소나에 우리 카테고리 MA 없음 / 0 | gate 차단. progress 0.22 cap. "MA blocker" 인사이트 카드 노출 |

### 가설 B — Frequency S-curve
| | 입력 | 예상 결과 |
|---|---|---|
| B1 | 다채널 분산, 누적 1-2회 | 미미한 진전 |
| B2 | 단일 채널 집중, 5-8회 | 3-5회차 가속 + Frequency-Response 곡선 명확 |

### 가설 C — Cialdini multiplier
| | 입력 | 예상 결과 |
|---|---|---|
| C1 | creative_summary 에 social proof 키워드 없음 | 기본 진전 |
| C2 | "300만 가입", 후기 4.8점 키워드 + 페르소나 social_proof 0.7+ | C1 보다 큰 funnel 진전. 같은 페르소나 social_proof 0.2 면 C1≈C2 |

### 가설 D — Forgetting curve
| | 입력 | 예상 결과 |
|---|---|---|
| D1 | 24h 시뮬 5회 노출 | effective ≈ raw |
| D2 | 7d 시뮬 같은 5회 분산 | effective < raw. 30d 첫날 노출 거의 효과 0 |

### 부정 케이스
- 60대 보수 페르소나 (status_quo_bias 0.8+) × 20대 SaaS → 24h 노출 24회도 unaware 유지 → 만약 considering+ 가면 weight 너무 헐거움

### 측정 메트릭
- Funnel 단계 변화
- 노출 횟수 분포 (Reach 차트)
- Frequency-Response 곡선 형태
- Internal reasoning 톤 (System 1 짧음 / System 2 길음)
- 인사이트 카드 자동 노출 여부
- 마케터 직관 1-10 점

### 합격 기준
- 가설 A·B·D 의 예상 결과가 60%+ 시뮬에서 재현
- 가설 C 는 페르소나별 susceptibility 와 일관 (LLM stochasticity 감안)
- 부정 케이스에서 funnel 거의 정체

### 불합격 시 액션
- 점수 함수 weight 조정 ([marketing-engine.ts](../src/lib/marketing-engine.ts) 의 상수)
- LLM 톤 가이드 강화 ([sim-day-prompt.ts](../src/lib/sim-day-prompt.ts))
- schema default 재조정 ([persona-prompt.ts](../src/lib/persona-prompt.ts))

---

## 8. Anti-pattern — 피할 함정

- ❌ 1회 시뮬로 결론 — stochasticity 때문. 가설당 2-3회 반복
- ❌ "느낌상 맞아 보임" — 정량 비교 없이 narrative 만 읽으면 LLM 그럴듯함에 속음
- ❌ Counterfactual baseline 부재 — P2-1 까지 보류, 그 전엔 인사이트에 caveat 명시
- ❌ Production URL 다중 curl — Vercel Bot Protection 트리거 위험. 사용자 브라우저 검증
- ❌ Supabase MCP 로 직접 schema drop — `apply_migration` carefully
- ❌ OpenAI Project Allow list 비워두기 — 전부 차단됨 ([TOOL_GOTCHAS.md 참조](#))

---

## 9. 의존성 / 외부 시스템

### 현재 채택
- Next.js 16 + React 19 + TypeScript strict
- Tailwind v4 + shadcn/ui v3
- Motion (motion.dev) + Phosphor Icons + Rive (placeholder)
- Zustand (state + persist)
- Zod (schema validation)
- 4 LLM provider (BYOK) — OpenRouter / OpenAI / Anthropic / Google

### Phase 6+ 도입 예정
- Supabase (auth + DB + pgvector + Realtime)
- (옵션) Inngest — 다중 사용자 시뮬 fan-out
- (옵션) Vercel AI SDK — streaming 도입 시
- (옵션) Mastra — 메모리 압축·workflow

---

## 10. 사용자 액션 vs AI 액션

**AI 가 하는 것**:
- 코드·테스트·문서 작성
- TypeScript 타입 + Zod schema
- Marketing engine 로직
- LLM prompt 작성
- 빌드 검증 (`tsc`, `lint`, `next build`)

**사용자가 하는 것**:
- 실제 시뮬 실행 + 마케터 직관 평가 (회귀 검증)
- BYOK API 키 발급 + Vercel env 등록
- Supabase 프로젝트 생성 (Phase 6 시작 시)
- production 배포 검증 (브라우저 로딩 확인)
- 디자인 / UX 방향성 결정

---

## 11. 참고 자료

### 마케팅·심리 이론
- [Krugman 3-hit](https://medium.com/@yroufuk/the-frequency-dilemma-a82bef468b19)
- [Petty-Cacioppo ELM](https://www.tandfonline.com/doi/full/10.1080/23311908.2017.1363343)
- [Cialdini 6 principles](https://people-shift.com/articles/cialdinis-6-principles-of-persuasion/)
- [Byron Sharp — How Brands Grow](https://brandgenetics.com/human-thinking/how-brands-grow-speed-summary/)
- [Kahneman System 1/2](https://imotions.com/blog/insights/research-insights/system-1-and-system-2/)
- [McKinsey CDJ + Loyalty Loop](https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights/the-consumer-decision-journey)

### 시뮬레이션 레퍼런스
- [Stanford Generative Agents (Smallville)](https://arxiv.org/abs/2304.03442)
- [Delve AI](https://www.delve.ai/synthetic-users)

### 기술 스택
- [shadcn/ui](https://ui.shadcn.com/)
- [Motion (motion.dev)](https://motion.dev/)
- [Supabase](https://supabase.com/docs)
- 자세한 비교: plan §3
