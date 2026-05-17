# 🎭 Persona Simulator

## Tagline-en

Watch AI personas live a full day reacting to your ads — then pause and ask them why they almost bought, why they didn't, and what almost worked.

## Tagline-ko

마케터의 가설을 24시간짜리 가상 고객 라이프로 재생합니다. 페르소나가 광고를 보고 무시하고, 친구에게 묻고, 마음이 흔들리는 그 순간을 일기처럼 따라가다 잠시 멈춰 직접 물어볼 수 있는 시뮬레이터.

## Tagline-ja

マーケターの仮説を24時間の仮想顧客ライフとして再生する。ペルソナが広告を見て無視し、友人に尋ね、心が揺らぐその瞬間を日記のように追いながら、一時停止して直接質問できるシミュレーター。

---

## Summary-en

A/B testing a campaign before launch usually means slow surveys or expensive focus groups — and either way, real customers stay invisible until it's too late. Persona Simulator drops your product into the lives of synthetic personas grounded in real marketing science (Krugman frequency, Cialdini influence, Byron Sharp mental availability) and plays out their day-by-day exposure, internal reasoning, and funnel movement as a readable life log. When something interesting happens, pause time and interview the persona about that exact moment. The result feels less like a dashboard and more like watching a play, then sitting down for coffee with the lead character.

## Summary-ko

캠페인 출시 전 A/B 검증은 보통 느린 설문이나 비싼 FGI — 어느 쪽이든 진짜 고객은 늦게야 보입니다. Persona Simulator 는 제품과 채널 plan 을 입력하면, 실제 마케팅 학문 (Krugman 빈도 효과, Cialdini 영향력 원리, Byron Sharp mental availability) 에 기반한 가상 페르소나의 하루를 라이프 로그로 재생합니다. 출근길 인스타그램에서 광고를 흘려보내는 순간, 점심 시간 동료의 추천에 마음이 흔들리는 순간, funnel 단계가 바뀌는 순간 — 모두 1인칭 일기로 흐릅니다. 흥미로운 시점에서 일시정지하면 페르소나가 "왜 그랬는지" 직접 답합니다. 대시보드가 아닌, 연극 한 편 보고 주인공과 커피 마시는 경험에 가깝습니다.

## Summary-ja

キャンペーンのA/B検証は通常、遅いアンケートか高価なFGI — どちらにせよ本当の顧客は手遅れになるまで見えません。Persona Simulator は製品とチャネルプランを入力すると、実際のマーケティング学問 (Krugmanの頻度効果、Cialdiniの影響力原理、Byron Sharpのメンタル・アベイラビリティ) に基づいた仮想ペルソナの一日をライフログとして再生します。通勤のインスタで広告を見過ごす瞬間、ランチで同僚に勧められて心が揺れる瞬間、ファネル段階が動く瞬間 — すべて一人称の日記として流れます。気になる時点で一時停止すれば、ペルソナが「なぜそうしたのか」を直接答えてくれます。ダッシュボードではなく、一本の演劇を観てから主役とコーヒーを飲む体験に近い形です。

---

## ✨ What It Does

- **Generates marketing-grounded personas** — UX research template (Goals / Pain Points / Behaviors / Triggers / Barriers / Resonating Messages) plus simulation fields like Cialdini susceptibility, cognitive processing mode, and mental availability per category — filled by your choice of LLM.
- **Plays a day-by-day life log** — 24h / 7d / 30d simulations stream as diary cards (gray) and ad-exposure cards (brand-colored) with the persona's first-person internal reasoning and funnel stage transitions.
- **Decides outcomes deterministically, narrates them with an LLM** — server-side marketing engine (Krugman frequency S-curve, Cialdini multipliers, Ebbinghaus forgetting half-life, Sharp mental availability gate) computes what happens; the LLM only writes how it feels.
- **Pauses time for interviews** — click any moment in the timeline, ask "why didn't you buy?" or "did you see this ad?", and the persona answers using only what they experienced up to that point. Citations link back to the exact entries in the feed.
- **Tracks Reach × Funnel × Multi-Touch Attribution** — channel-by-channel exposure counts, frequency-response curves, McKinsey CDJ phase distribution, plus last-touch / first-touch / linear / time-decay attribution comparisons.
- **Auto-generates diagnostic insights** — "Persona A keeps bouncing off because their mental availability for this category is empty," "Word-of-mouth converts 3× better than paid for high social-proof personas," with sample-size caveats so you don't over-trust small N.
- **Brings your own keys (BYOK)** — pick from OpenRouter, OpenAI, Anthropic, or Google Gemini. Keys stay in your browser; the server only relays.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| UI runtime | React 19 |
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui v3 (Radix + Base UI) |
| Motion | Motion (motion.dev) |
| Icons | Phosphor Icons (6 weights) |
| Character animation | Rive (placeholder, full rig planned) |
| Charts | Recharts via shadcn Chart |
| State | Zustand 5 (localStorage persist) |
| Schema validation | Zod 4 |
| LLM providers (BYOK) | OpenRouter · OpenAI · Anthropic · Google Gemini |
| Forms | React Hook Form |
| Notifications | Sonner |
| Deploy | Vercel (Edge runtime for sim routes) |

---

## 📦 Installation

```bash
git clone https://github.com/hsu3046/persona-simulator.git
cd persona-simulator
npm install
cp .env.example .env.local   # Optional — BYOK from the UI works without server env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), pick an AI provider in the top-right settings, paste your API key, and start by generating personas.

> No keys? Sample (mock) data still plays the full simulation — just without LLM-generated narrative diversity.

---

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── personas/generate/   # LLM persona generation route
│   │   │   └── sim/
│   │   │       ├── generate-day/    # Edge route — planner + LLM narrative
│   │   │       └── interview/       # Edge route — retrieval + LLM Q&A
│   │   ├── personas/                # Persona list + create dialog + detail sheet
│   │   ├── products/                # Product / campaign forms with DBA inputs
│   │   ├── simulation/              # Main simulation page (feed + tabs + insights)
│   │   ├── history/                 # Past simulation runs
│   │   └── layout.tsx               # Root layout with site header + AI settings
│   ├── components/
│   │   ├── persona/                 # Avatar, card, create dialog, detail sheet
│   │   ├── product/                 # Form sheet, channel plan editor
│   │   ├── simulation/              # Feed cards, persona tabs, insights panel, interview drawer
│   │   ├── history/                 # Run list + restore
│   │   ├── ai-settings-dialog.tsx   # BYOK key + model picker (4 providers)
│   │   ├── site-header.tsx          # Top nav
│   │   └── ui/                      # shadcn/ui generated primitives
│   ├── lib/
│   │   ├── marketing-engine.ts      # Deterministic scoring (frequency, cialdini, MA, MTA, CDJ)
│   │   ├── sim-day-planner.ts       # Plans exposure sequence + funnel deltas
│   │   ├── sim-day-prompt.ts        # LLM narrative-only prompt + Zod schema
│   │   ├── persona-prompt.ts        # Persona generation prompt with grounding fields
│   │   ├── insights.ts              # Feed → diagnostic insight cards
│   │   ├── interview-prompt.ts      # Interview prompt + answer schema
│   │   ├── interview-retrieval.ts   # Keyword + recency retrieval (pgvector later)
│   │   ├── ai/                      # 4-provider BYOK adapter (openrouter/openai/claude/gemini)
│   │   └── mock-stream.ts           # Sample feed for keys-not-set fallback
│   ├── stores/                      # Zustand: simulation, personas, products, interview, AI
│   ├── types/                       # Persona, Product, Exposure, LifeEntry, Funnel, Interview
│   └── mocks/                       # Demo fixtures
├── docs/
│   ├── IMPLEMENTATION_PLAN.md       # Phased roadmap with current progress
│   ├── ARCHITECTURE.md              # Module responsibility split
│   └── MEMORY.md                    # Decision log
├── public/                          # Static assets (logo, OG images)
└── package.json
```

---

## 🗺 Roadmap

- [ ] **Regression verification scenarios** — run the 4 grounding hypotheses (MA gate / Krugman S-curve / Cialdini / forgetting curve) end-to-end and tune weights
- [ ] **Multi-Touch Attribution chart** — turn the MTA comparison insight from text into a grouped bar chart (last / first / linear / time-decay × channels)
- [ ] **Streaming interview responses** — token-by-token LLM output instead of single-shot
- [ ] **Supabase backend** — replace browser-only Zustand persist with cloud storage + pgvector for true retrieval + Realtime broadcast
- [ ] **Supabase Auth** — magic link + Google OAuth, RLS-scoped per-user data
- [ ] **Counterfactual baseline** — run a parallel "no-ads" simulation to measure incremental lift
- [ ] **Monte Carlo runs** — N parallel simulations of the same input to reveal result distribution
- [ ] **Mobile-first layout** — bottom-drawer insights panel, horizontal persona scroller
- [ ] **Onboarding tour** — 3-step intro (persona → product → simulation)
- [ ] **Share-friendly OG images** — auto-generated result cards for social previews

Detailed phasing: see [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md).

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat(scope): add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html).

---

*Built by [KnowAI](https://knowai.space) · © 2026 KnowAI*
