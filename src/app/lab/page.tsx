"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircleIcon,
  HeartIcon,
  PaletteIcon,
  PlayIcon,
  PlusIcon,
  SmileyIcon,
  SparkleIcon,
  StopIcon,
  UserIcon,
} from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { MOCK_PERSONAS, MOCK_PRODUCT, STREAM_PARK_JIYOUNG } from "@/mocks";
import { inferMood } from "@/lib/mood";
import { formatKRW, formatSimTime } from "@/lib/format";
import type { PhosphorWeight } from "@/lib/mood";

const PHOSPHOR_WEIGHTS: PhosphorWeight[] = [
  "thin",
  "light",
  "regular",
  "bold",
  "fill",
  "duotone",
];

export default function LabPage() {
  const [visibleCount, setVisibleCount] = useState(3);
  const [weightIdx, setWeightIdx] = useState(4);
  const currentWeight = PHOSPHOR_WEIGHTS[weightIdx] ?? "regular";

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <header className="mb-10">
        <Badge variant="secondary" className="mb-3">
          Phase 0 — 라이브러리 검증
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          디자인 시스템 + 라이브러리 동작 확인
        </h1>
        <p className="text-muted-foreground mt-2">
          shadcn/ui · Motion · Phosphor Icons · Mock fixture · Tailwind v4
          토큰까지 한 페이지에서 검증.
        </p>
      </header>

      <Tabs defaultValue="icons" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="icons">
            <PaletteIcon weight="regular" className="size-4" />
            Icons
          </TabsTrigger>
          <TabsTrigger value="personas">
            <UserIcon weight="regular" className="size-4" />
            Personas
          </TabsTrigger>
          <TabsTrigger value="stream">
            <PlayIcon weight="regular" className="size-4" />
            Stream
          </TabsTrigger>
          <TabsTrigger value="tokens">
            <SparkleIcon weight="regular" className="size-4" />
            Tokens
          </TabsTrigger>
        </TabsList>

        {/* ─── 1. Phosphor weight 동적 변경 ─── */}
        <TabsContent value="icons" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Phosphor Icons — 6 weights 동적 변경</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                감정 상태에 따라 아이콘 weight 가 바뀝니다. 행복=Fill, 피곤=Thin,
                평온=Regular, 스트레스=Bold.
              </p>
              <div className="flex items-center gap-4">
                <SmileyIcon weight={currentWeight} className="size-16 text-accent" />
                <HeartIcon weight={currentWeight} className="size-16 text-destructive" />
                <SparkleIcon weight={currentWeight} className="size-16 text-spark" />
                <CheckCircleIcon weight={currentWeight} className="size-16 text-primary" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">현재 weight</span>
                  <span className="font-mono">{currentWeight}</span>
                </div>
                <Slider
                  min={0}
                  max={5}
                  step={1}
                  value={[weightIdx]}
                  onValueChange={(v) => {
                    const n = Array.isArray(v) ? v[0] : v;
                    setWeightIdx(typeof n === "number" ? n : 0);
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  {PHOSPHOR_WEIGHTS.map((w) => (
                    <span key={w}>{w}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── 2. Persona 카드 ─── */}
        <TabsContent value="personas" className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            5명의 mock 페르소나. UX 템플릿 8섹션 + 시뮬 보조 필드(`_sim`) 채워진 상태.
            아래는 카드 표면(요약). Phase 1 에서 drawer 로 전체 8섹션 펼침 구현.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_PERSONAS.map((p, i) => {
              const mood = inferMood(p.current_state.mood);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{p.basic.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {p.basic.age_range} · {p.basic.occupation}
                          </p>
                        </div>
                        <span
                          className="shrink-0 text-2xl leading-none"
                          title={mood.label}
                          aria-label={`기분: ${mood.label}`}
                        >
                          {mood.emoji}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground">
                          디지털 숙련도
                        </span>
                        <div className="font-medium">{p.basic.digital_literacy}</div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">목표</span>
                        <ul className="list-disc list-inside text-foreground">
                          {p.goals.slice(0, 2).map((g, idx) => (
                            <li key={idx} className="line-clamp-1">
                              {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px]"
                        >
                          소득 {p._sim.income_decile} 분위
                        </Badge>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px]"
                        >
                          {p._sim.innovation_adoption}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* ─── 3. Mock stream (Motion AnimatePresence + layout) ─── */}
        <TabsContent value="stream" className="mt-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold">박지영 — 5/16 라이프 스트림</h3>
              <p className="text-xs text-muted-foreground">
                {MOCK_PRODUCT.name} 캠페인 노출 포함 · 총{" "}
                {STREAM_PARK_JIYOUNG.length} 엔트리
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setVisibleCount(3)}
              >
                <StopIcon weight="fill" className="size-3" />
                리셋
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  setVisibleCount((c) =>
                    Math.min(c + 1, STREAM_PARK_JIYOUNG.length),
                  )
                }
                disabled={visibleCount >= STREAM_PARK_JIYOUNG.length}
              >
                <PlusIcon weight="bold" className="size-3" />
                다음 카드
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {STREAM_PARK_JIYOUNG.slice(0, visibleCount).map((entry) => (
                <motion.div
                  key={
                    entry.kind === "life"
                      ? entry.data.id
                      : entry.kind === "exposure"
                        ? entry.data.id
                        : entry.data.id
                  }
                  layout
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 280, damping: 28 }}
                >
                  <StreamCard entry={entry} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* ─── 4. 디자인 토큰 시각 검증 ─── */}
        <TabsContent value="tokens" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cozy Dashboard 디자인 토큰</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Section title="베이스">
                <Swatch name="background" varName="--background" />
                <Swatch name="foreground" varName="--foreground" />
                <Swatch name="primary" varName="--primary" />
                <Swatch name="accent" varName="--accent" />
                <Swatch name="secondary" varName="--secondary" />
                <Swatch name="muted" varName="--muted" />
              </Section>
              <Section title="App 시맨틱">
                <Swatch name="life" varName="--life" />
                <Swatch name="exposure" varName="--exposure" />
                <Swatch name="spark" varName="--spark" />
              </Section>
              <Section title="Funnel stages">
                <Swatch name="unaware" varName="--funnel-unaware" />
                <Swatch name="aware" varName="--funnel-aware" />
                <Swatch name="consider" varName="--funnel-consider" />
                <Swatch name="intent" varName="--funnel-intent" />
                <Swatch name="purchase" varName="--funnel-purchase" />
                <Swatch name="advocate" varName="--funnel-advocate" />
              </Section>
              <Section title="Persona palette (chart 1-5)">
                <Swatch name="ch1 coral" varName="--chart-1" />
                <Swatch name="ch2 mint" varName="--chart-2" />
                <Swatch name="ch3 periwinkle" varName="--chart-3" />
                <Swatch name="ch4 mustard" varName="--chart-4" />
                <Swatch name="ch5 lilac" varName="--chart-5" />
              </Section>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────

function StreamCard({
  entry,
}: {
  entry: (typeof STREAM_PARK_JIYOUNG)[number];
}) {
  if (entry.kind === "life") {
    const { data } = entry;
    return (
      <Card className="bg-life border-border/70">
        <CardContent className="py-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{formatSimTime(data.sim_timestamp)}</span>
            <Badge variant="outline" className="text-[10px]">
              {data.type}
            </Badge>
            {data.location && <span>· {data.location}</span>}
          </div>
          <p className="text-sm leading-relaxed text-life-foreground">
            {data.diary}
          </p>
          {data.spend && (
            <div className="text-xs text-muted-foreground">
              💸 {data.spend.brand ?? data.spend.category} ·{" "}
              {formatKRW(data.spend.amount)}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  if (entry.kind === "exposure") {
    const { data } = entry;
    return (
      <Card
        className="border-exposure/40 bg-exposure/15"
        style={{ borderLeftWidth: 4, borderLeftColor: "var(--exposure)" }}
      >
        <CardContent className="py-4 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-exposure-foreground">
              {formatSimTime(data.sim_timestamp)}
            </span>
            <Badge className="text-[10px] bg-exposure text-exposure-foreground">
              📣 {data.channel}
            </Badge>
            <span className="text-muted-foreground">
              {data.prior_exposure_count + 1}회차 노출
            </span>
          </div>
          <div className="text-sm space-y-1">
            <p className="font-medium">&ldquo;{data.message_received}&rdquo;</p>
            <p className="italic text-exposure-foreground/80">
              💭 {data.internal_reasoning}
            </p>
          </div>
          {data.funnel_stage_before !== data.funnel_stage_after && (
            <div className="text-xs text-spark-foreground bg-spark/30 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full">
              <SparkleIcon weight="fill" className="size-3" />
              {data.funnel_stage_before} → {data.funnel_stage_after}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  // funnel transition
  const { data } = entry;
  return (
    <Card className="border-dashed border-spark/50 bg-spark/10">
      <CardContent className="py-3 text-xs flex items-center gap-2">
        <SparkleIcon weight="fill" className="size-4 text-spark" />
        <span className="font-mono">{formatSimTime(data.sim_timestamp)}</span>
        <span className="text-muted-foreground">funnel 전환:</span>
        <span className="font-semibold">
          {data.from_stage} → {data.to_stage}
        </span>
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Swatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="size-14 rounded-lg border border-border"
        style={{ backgroundColor: `var(${varName})` }}
      />
      <div className="text-[10px] text-center leading-tight">
        <div className="font-mono">{name}</div>
        <div className="text-muted-foreground">{varName}</div>
      </div>
    </div>
  );
}
