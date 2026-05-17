// 마케팅·심리 grounded 시뮬 planner — 서버에서 deterministic 으로 노출 sequence 결정.
// LLM 은 narrative 만 채움 (1인칭 diary / internal_reasoning / message_received / action).
//
// Plan §9.3 — 책임 분리.

import {
  cialdiniMultiplier,
  computeAttentionLevel,
  computeExposureProbability,
  computeFunnelDelta,
  computeMessageMatch,
  computePriceConcern,
  dbaContributionPerExposure,
  detectCreativeSignals,
  effectiveCognitiveMode,
  effectiveExposureCount,
  getInvolvement,
  getLossAversion,
  getMentalAvailability,
  getStatusQuoBias,
  mentalAvailabilityGate,
  progressToStage,
  stageToProgress,
} from "@/lib/marketing-engine";
import { type SimDuration } from "@/lib/sim-duration";
import type {
  FunnelStage,
  MediaChannel,
  Persona,
  Product,
} from "@/types";

export interface PlannedExposure {
  day: number; // 0 - (duration days - 1)
  hour: number;
  minute: number;
  channel: MediaChannel;
  /** 0-based 누적 노출 횟수 (이전 노출 수) */
  prior_exposure_count: number;
  attention_level: number;
  funnel_stage_before: FunnelStage;
  funnel_stage_after: FunnelStage;
  /** 마케팅 엔진이 분석한 점수·시그널 (LLM narrative 의 hint) */
  meta: {
    cialdini_multiplier: number;
    message_match: number;
    creative_signals: ReturnType<typeof detectCreativeSignals>;
    cognitive_mode: "system1" | "system2";
    delta_progress: number;
    /** Sharp Mental Availability gate 결과 */
    ma_gate: { passed: boolean; reason: string };
    /** 시간 가중 누적 노출 수 (forgetting curve 적용) */
    effective_prior_exposures: number;
    /** 이 노출 후 페르소나 mental_availability 추정값 */
    estimated_ma_after: number;
  };
}

export interface PlannedDay {
  duration: SimDuration;
  total_days: number;
  exposures: PlannedExposure[];
}

// ─────────────────────────────────────────────────
// Planner
// ─────────────────────────────────────────────────

interface PlanArgs {
  persona: Persona;
  product: Product;
  duration: SimDuration;
  /** 결정성 시드 (사용자 동일 입력에 동일 결과). 기본 hash(persona.id+product.id+duration) */
  seed?: number;
}

/**
 * 페르소나 × 제품 × 기간 → 발생할 노출 sequence 와 funnel 진행을 시뮬레이션.
 * Deterministic: 동일 입력 + seed 면 동일 결과 (LLM 호출 없음).
 */
export function planSimulationDay(args: PlanArgs): PlannedDay {
  const { persona, product, duration } = args;
  const seed = args.seed ?? hashSeed(persona.id + product.id + duration);
  const rand = mulberry32(seed);

  const days = duration === "24h" ? 1 : duration === "7d" ? 7 : 30;
  const exposures: PlannedExposure[] = [];

  // 페르소나 ∩ 제품 채널 매칭
  const candidateChannels = product.channels
    .map((c) => c.channel)
    .filter((ch) =>
      persona._sim.media_channels.some(
        (m) => m.channel === ch && m.daily_minutes > 0,
      ),
    );
  if (candidateChannels.length === 0) {
    // fallback: 제품의 top 채널 1개로 강제
    const top = product.channels[0]?.channel;
    if (top) candidateChannels.push(top);
  }

  // funnel progress 누적
  let progress = stageToProgress("unaware");
  let stage: FunnelStage = "unaware";

  // 시간 슬롯 정의 — duration 별 다름
  const slots = generateTimeSlots(duration, days);

  const priceConcern = computePriceConcern(persona, product.price_krw);
  const involvement = getInvolvement(persona, product.category);
  const initialMentalAvailability = getMentalAvailability(persona, product.category);
  const lossAversion = getLossAversion(persona);
  const statusQuoBias = getStatusQuoBias(persona);
  const incumbent = persona._sim.category_preferences[product.category];
  const hasIncumbentBrand = !!incumbent?.current_brand;

  // Sharp DBA — 마케터가 입력한 distinctive_assets 수
  const dbaCount = product.distinctive_assets
    ? Object.values(product.distinctive_assets).filter((v) => v && v.trim()).length
    : 0;
  const hasDBA = dbaCount > 0;
  const dbaBoostPerExposure = dbaContributionPerExposure(dbaCount);

  // 페르소나의 mental_availability 는 시뮬 중 누적 노출로 증가 (DBA 가중)
  let currentMA = initialMentalAvailability;

  // 노출 timestamp 누적 — forgetting curve effective count 계산용
  const exposureTimes: string[] = [];

  // 시뮬 baseline date — toIso 의 baseDate 가정과 일관
  const baseDate = "2026-05-16";
  const toIsoForPlanner = (day: number, hour: number, minute: number): string => {
    const d = new Date(`${baseDate}T00:00:00`);
    d.setDate(d.getDate() + day);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  // 각 슬롯마다 노출 발생 여부 추첨.
  // 슬롯 내 분은 jitter — 다채널 동시 점화·획일적 정각 노출 방지.
  for (const slot of slots) {
    for (const channel of candidateChannels) {
      const habit = persona._sim.media_channels.find((m) => m.channel === channel);
      if (!habit) continue;

      const exposureP = computeExposureProbability({
        channel,
        persona,
        product,
        windowMinutes: slot.windowMinutes,
      });
      // 노출 확률 — duration 길수록 slot 마다 확률 약간 낮춤 (전체 분량 balance)
      const adjustedP =
        exposureP * (duration === "30d" ? 0.35 : duration === "7d" ? 0.6 : 1.0);

      if (rand() > adjustedP) continue;

      // 광고 plan 의 creative_summary 에서 시그널 추출
      const channelPlan = product.channels.find((c) => c.channel === channel);
      const creativeSummary = channelPlan?.creative_summary ?? "";
      const signals = detectCreativeSignals(creativeSummary);
      const creativeQuality = 0.5 + (Object.values(signals).filter(Boolean).length / 6) * 0.4;

      const priorCount = exposures.filter((e) => e.channel === channel).length;

      // ── 슬롯 내 jitter ──
      const jitterRange = slot.windowMinutes;
      const offset = Math.floor((rand() - 0.5) * jitterRange);
      const { hour: jHour, minute: jMinute } = applyMinuteOffset(
        slot.hour,
        slot.minute,
        offset,
      );
      const nowIso = toIsoForPlanner(slot.day, jHour, jMinute);

      // ── Forgetting curve — 누적 effective 노출 ──
      const effectivePrior = effectiveExposureCount(exposureTimes, nowIso, 2);

      const attention = computeAttentionLevel({
        receptivity: habit.receptivity_to_ads,
        creativeQuality,
        hour: jHour,
        // attention 의 fatigue 계산에도 effective count 사용
        priorExposureCount: Math.round(effectivePrior),
      });

      if (attention < 0.15 && rand() > 0.5) continue;

      const cMult = cialdiniMultiplier({ persona, channel, signals });
      const messageMatch = computeMessageMatch(
        creativeSummary,
        persona.resonating_messages,
      );

      // ── Sharp Mental Availability gate ──
      // initial_consideration 진입 전엔 funnel 진전 매우 제한적.
      const gate = mentalAvailabilityGate({
        mentalAvailability: currentMA,
        effectiveExposures: effectivePrior,
        hasDistinctiveAssets: hasDBA,
      });

      let delta = computeFunnelDelta({
        attention,
        priorExposureCount: Math.round(effectivePrior),
        messageMatchScore: messageMatch,
        cialdiniMult: cMult,
        involvement,
        lossAversion,
        priceConcern,
        mentalAvailability: currentMA,
        statusQuoBias,
        hasIncumbentBrand,
        currentStageProgress: progress,
      });

      // Gate 미통과 시 funnel delta 급감 (interested 이상 진입 차단)
      // — Sharp 의 핵심 주장: out-of-market 페르소나는 노출만으로 잘 안 옮겨감
      if (!gate.passes) {
        delta = delta * 0.25;
        // unaware/aware 까지만 허용 — progress >= 0.22 못 넘어가도록
        if (progress + delta > 0.22) delta = Math.max(0, 0.22 - progress);
      }

      const before = stage;
      progress = Math.min(1, progress + delta);
      const after = progressToStage(progress);
      stage = after;

      // 이 노출이 끝난 후 MA 누적 (DBA 효과)
      currentMA = Math.min(1, currentMA + dbaBoostPerExposure);
      exposureTimes.push(nowIso);

      const mode = effectiveCognitiveMode(persona, jHour);

      exposures.push({
        day: slot.day,
        hour: jHour,
        minute: jMinute,
        channel,
        prior_exposure_count: priorCount,
        attention_level: round2(attention),
        funnel_stage_before: before,
        funnel_stage_after: after,
        meta: {
          cialdini_multiplier: round2(cMult),
          message_match: round2(messageMatch),
          creative_signals: signals,
          cognitive_mode: mode,
          delta_progress: round2(delta),
          ma_gate: { passed: gate.passes, reason: gate.reason },
          effective_prior_exposures: round2(effectivePrior),
          estimated_ma_after: round2(currentMA),
        },
      });
    }
  }

  // 시간순 정렬
  exposures.sort((a, b) => slotKey(a) - slotKey(b));

  // 단계당 최대 노출 캡 (30d 의 경우 너무 많이 나올 수 있어)
  const maxByDuration = duration === "30d" ? 22 : duration === "7d" ? 14 : 8;
  const trimmed = exposures.slice(0, maxByDuration);

  return { duration, total_days: days, exposures: trimmed };
}

// ─────────────────────────────────────────────────
// 시간 슬롯 — duration 별
// ─────────────────────────────────────────────────

interface TimeSlot {
  day: number;
  hour: number;
  minute: number;
  windowMinutes: number;
}

function generateTimeSlots(duration: SimDuration, days: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  if (duration === "24h") {
    // 분 단위 — 주요 시간대 8개
    const blocks = [
      { h: 7, m: 30 },
      { h: 10, m: 30 },
      { h: 12, m: 30 },
      { h: 15, m: 0 },
      { h: 18, m: 30 },
      { h: 20, m: 0 },
      { h: 21, m: 30 },
      { h: 22, m: 30 },
    ];
    for (const b of blocks) {
      slots.push({ day: 0, hour: b.h, minute: b.m, windowMinutes: 60 });
    }
  } else if (duration === "7d") {
    // 일별 4 시간대 (아침/점심/저녁/밤)
    for (let d = 0; d < days; d++) {
      slots.push({ day: d, hour: 8, minute: 0, windowMinutes: 240 });
      slots.push({ day: d, hour: 13, minute: 0, windowMinutes: 120 });
      slots.push({ day: d, hour: 19, minute: 0, windowMinutes: 180 });
      slots.push({ day: d, hour: 22, minute: 0, windowMinutes: 120 });
    }
  } else {
    // 30d — 일별 highlight 2 슬롯
    for (let d = 0; d < days; d++) {
      slots.push({ day: d, hour: 12, minute: 0, windowMinutes: 360 });
      slots.push({ day: d, hour: 20, minute: 0, windowMinutes: 240 });
    }
  }
  return slots;
}

function slotKey(e: PlannedExposure): number {
  return e.day * 24 * 60 + e.hour * 60 + e.minute;
}

/** hour/minute 에 +offsetMin 을 안전하게 더함. 자정 넘는 경우 범위 안에 clamp. */
function applyMinuteOffset(
  hour: number,
  minute: number,
  offsetMin: number,
): { hour: number; minute: number } {
  let total = hour * 60 + minute + offsetMin;
  // 같은 day 안에서만 clamp — 자정 넘으면 23:55 로, 자정 전이면 00:05 로
  if (total < 0) total = Math.min(60, hour * 60 + minute);
  if (total >= 24 * 60) total = 23 * 60 + 55;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return { hour: h, minute: m };
}

// ─────────────────────────────────────────────────
// utils
// ─────────────────────────────────────────────────

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let s = seed;
  return function rand() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
