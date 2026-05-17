// 시뮬 결과에서 인사이트 narrative 생성.
// Plan §9 — 마케팅·심리 학문 grounded.

import { CHANNEL_META } from "@/lib/channel-meta";
import { FUNNEL_META } from "@/lib/funnel-meta";
import {
  type AttributionModel,
  computeAttribution,
  getMentalAvailability,
} from "@/lib/marketing-engine";
import type {
  Exposure,
  FeedEntry,
  FunnelStage,
  InsightCard,
  MediaChannel,
  Persona,
} from "@/types";

interface AggregatedData {
  exposuresByChannel: Map<MediaChannel, Exposure[]>;
  exposuresByPersona: Map<string, Exposure[]>;
  funnelByPersona: Map<string, FunnelStage>;
  transitionsByPersona: Map<string, number>;
  topPersonas: Persona[];
}

export interface ReachStat {
  channel: MediaChannel;
  exposures: number;
  avgAttention: number;
  funnelLifts: number;
}

export interface FrequencyResponseStat {
  frequency: number;
  total: number;
  advanced: number;
  responseRate: number;
}

export interface FunnelStageStat {
  stage: FunnelStage;
  count: number;
}

export function aggregate(
  personas: Persona[],
  feedByPersona: Record<string, FeedEntry[]>,
  funnelByPersona: Record<string, FunnelStage>,
): AggregatedData {
  const byChannel = new Map<MediaChannel, Exposure[]>();
  const byPersona = new Map<string, Exposure[]>();
  const transitions = new Map<string, number>();

  for (const persona of personas) {
    const feed = feedByPersona[persona.id] ?? [];
    const personaExposures: Exposure[] = [];
    let tCount = 0;
    for (const entry of feed) {
      if (entry.kind === "exposure") {
        personaExposures.push(entry.data);
        const arr = byChannel.get(entry.data.channel) ?? [];
        arr.push(entry.data);
        byChannel.set(entry.data.channel, arr);
      } else if (entry.kind === "funnel") {
        tCount++;
      }
    }
    byPersona.set(persona.id, personaExposures);
    transitions.set(persona.id, tCount);
  }

  const funnelMap = new Map<string, FunnelStage>();
  for (const [k, v] of Object.entries(funnelByPersona)) funnelMap.set(k, v);

  return {
    exposuresByChannel: byChannel,
    exposuresByPersona: byPersona,
    funnelByPersona: funnelMap,
    transitionsByPersona: transitions,
    topPersonas: personas,
  };
}

export function computeReachStats(agg: AggregatedData): ReachStat[] {
  const out: ReachStat[] = [];
  for (const [channel, exposures] of agg.exposuresByChannel) {
    const total = exposures.length;
    const avgAttention =
      total === 0 ? 0 : exposures.reduce((s, e) => s + e.attention_level, 0) / total;
    const lifts = exposures.filter(
      (e) => e.funnel_stage_before !== e.funnel_stage_after,
    ).length;
    out.push({
      channel,
      exposures: total,
      avgAttention,
      funnelLifts: lifts,
    });
  }
  out.sort((a, b) => b.exposures - a.exposures);
  return out;
}

export function computeFrequencyResponse(
  agg: AggregatedData,
): FrequencyResponseStat[] {
  // x = prior_exposure_count + 1 (몇 번째 노출에서)
  // y = funnel 진전이 일어난 비율
  const bucket = new Map<number, { total: number; advanced: number }>();
  for (const exposures of agg.exposuresByPersona.values()) {
    for (const e of exposures) {
      const freq = e.prior_exposure_count + 1;
      const b = bucket.get(freq) ?? { total: 0, advanced: 0 };
      b.total++;
      if (e.funnel_stage_before !== e.funnel_stage_after) b.advanced++;
      bucket.set(freq, b);
    }
  }
  const out: FrequencyResponseStat[] = [];
  for (const [freq, { total, advanced }] of [...bucket.entries()].sort(
    (a, b) => a[0] - b[0],
  )) {
    out.push({
      frequency: freq,
      total,
      advanced,
      responseRate: total === 0 ? 0 : advanced / total,
    });
  }
  return out;
}

export function computeFunnelDistribution(
  agg: AggregatedData,
): FunnelStageStat[] {
  const counter = new Map<FunnelStage, number>();
  for (const stage of agg.funnelByPersona.values()) {
    counter.set(stage, (counter.get(stage) ?? 0) + 1);
  }
  return [...counter.entries()].map(([stage, count]) => ({ stage, count }));
}

// ── Narrative 인사이트 카드 생성 ──
export function generateInsights(
  personas: Persona[],
  feedByPersona: Record<string, FeedEntry[]>,
  funnelByPersona: Record<string, FunnelStage>,
): InsightCard[] {
  const agg = aggregate(personas, feedByPersona, funnelByPersona);
  const reach = computeReachStats(agg);
  const freq = computeFrequencyResponse(agg);
  const cards: InsightCard[] = [];

  // 1. 가장 빨리 진전한 페르소나
  let fastestId: string | null = null;
  let fastestStage: FunnelStage | null = null;
  let fastestProgress = -1;
  for (const [pid, stage] of agg.funnelByPersona) {
    const p = FUNNEL_META[stage].progress;
    if (p > fastestProgress) {
      fastestProgress = p;
      fastestStage = stage;
      fastestId = pid;
    }
  }
  if (fastestId && fastestStage && fastestProgress > 0) {
    const persona = personas.find((p) => p.id === fastestId);
    const exposures = agg.exposuresByPersona.get(fastestId) ?? [];
    if (persona) {
      cards.push({
        id: "ins-fastest",
        kind: "funnel",
        title: `${persona.basic.name} 이(가) 가장 멀리 갔다`,
        body: `${exposures.length}회 노출 후 ${FUNNEL_META[fastestStage].label} 단계로 진입. ${persona._sim.innovation_adoption} 유형이며 ${persona._sim.media_channels.length}개 채널에 활발히 노출됨.`,
        related_persona_ids: [fastestId],
      });
    }
  }

  // 2. 최고 효율 채널 — 표본 크기 충분할 때만 노출, 작으면 caveat 명시
  if (reach.length > 0) {
    const best = [...reach]
      .filter((r) => r.exposures >= 3) // 최소 3 회 노출은 있어야 비율 의미
      .sort((a, b) => b.funnelLifts / Math.max(1, b.exposures) - a.funnelLifts / Math.max(1, a.exposures))[0];
    if (best) {
      const eff = (best.funnelLifts / Math.max(1, best.exposures)) * 100;
      // N < 8 = 통계적 의미 약함 (Wilson score interval 도 매우 넓음)
      const lowSample = best.exposures < 8;
      cards.push({
        id: "ins-channel-best",
        kind: "reach",
        title: `${CHANNEL_META[best.channel].label} — 전환율 ${eff.toFixed(0)}% (탐색적)`,
        body: `${best.exposures}회 노출 중 ${best.funnelLifts}회 funnel 진전. 평균 attention ${(best.avgAttention * 100).toFixed(0)}%.${
          lowSample
            ? ` <em>주의 — 표본 ${best.exposures} 회로 신뢰구간 매우 넓음. 단정 어려움.</em>`
            : " <em>Cialdini 영향력 + 페르소나 receptivity 조합</em>."
        }`,
        related_channels: [best.channel],
      });
    }
  }

  // 3. WOM vs 광고 비교 — Cialdini social proof grounded
  const wom = reach.find((r) => r.channel === "word_of_mouth");
  const paidChannels: MediaChannel[] = [
    "instagram",
    "youtube",
    "tiktok",
    "subway_ad",
    "outdoor_ad",
    "tv",
  ];
  const paid = reach.filter((r) => paidChannels.includes(r.channel));
  if (wom && wom.exposures > 0 && paid.length > 0) {
    const paidAvgAttn =
      paid.reduce((s, r) => s + r.avgAttention * r.exposures, 0) /
      Math.max(1, paid.reduce((s, r) => s + r.exposures, 0));
    if (wom.avgAttention - paidAvgAttn > 0.15) {
      const liftPct = Math.round((wom.avgAttention / paidAvgAttn - 1) * 100);
      cards.push({
        id: "ins-wom-vs-paid",
        kind: "behavior",
        title: "입소문이 단일 광고보다 attention 가 높음",
        body: `입소문 평균 attention ${(wom.avgAttention * 100).toFixed(0)}% vs 유료 광고 평균 ${(paidAvgAttn * 100).toFixed(0)}%. ${liftPct}% 더 깊이 듣는다. <em>Cialdini 사회 증명 원리</em> + 한국 collective culture (×1.5 가중) 효과.`,
        related_channels: ["word_of_mouth"],
      });
    }
  }

  // 4. Frequency 임계점 — Krugman 3-hit 검증
  if (freq.length >= 3) {
    let threshold: FrequencyResponseStat | null = null;
    for (const f of freq) {
      if (f.responseRate >= 0.5 && f.frequency >= 2) {
        threshold = f;
        break;
      }
    }
    if (threshold) {
      const isKrugman = threshold.frequency >= 3 && threshold.frequency <= 5;
      cards.push({
        id: "ins-freq-threshold",
        kind: "reach",
        title: `${threshold.frequency}회 노출이 funnel 진전 임계점`,
        body: `누적 ${threshold.frequency}번째 노출에서 진전 확률 ${(threshold.responseRate * 100).toFixed(0)}%. ${
          isKrugman
            ? "<em>Krugman 3-hit 가설</em> 영역 — 1=호기심, 2=평가, 3=리마인더 패턴 확인."
            : "<em>Burton et al (2024) bombardment</em> 영역 — 6회 이상 반복 노출이 의향 형성 가속."
        }`,
      });
    } else {
      const top = [...freq].sort((a, b) => b.responseRate - a.responseRate)[0];
      if (top && top.responseRate > 0) {
        cards.push({
          id: "ins-freq-top",
          kind: "reach",
          title: `${top.frequency}회 노출이 가장 효과적`,
          body: `${top.frequency}번째 노출에서 진전 확률 ${(top.responseRate * 100).toFixed(0)}% (${top.advanced}/${top.total}). <em>S-curve frequency lift</em> 의 가속 구간.`,
        });
      }
    }
  }

  // 5. 안 진전한 페르소나 — 장벽 분석 (loss aversion / status quo bias 근거)
  const stuck = personas.filter((p) => {
    const stage = agg.funnelByPersona.get(p.id) ?? "unaware";
    return FUNNEL_META[stage].progress < 0.3;
  });
  if (stuck.length > 0 && stuck.length < personas.length) {
    const sample = stuck[0]!;
    const highLossAv =
      (sample._sim.loss_aversion ?? sample._sim.price_sensitivity) > 0.6;
    const highStatusQuo =
      (sample._sim.status_quo_bias ?? sample._sim.brand_loyalty) > 0.6;
    const reason = highLossAv
      ? " <em>Kahneman-Tversky 손실 회피</em> 높음 — 가격·전환 비용 부담."
      : highStatusQuo
        ? " <em>Status quo bias</em> 높음 — 기존 브랜드 만족도 견고."
        : "";
    cards.push({
      id: "ins-stuck",
      kind: "behavior",
      title: `${stuck.length}명의 페르소나가 인지 단계에서 멈춤`,
      body: `${sample.basic.name} 등은 노출됐지만 마음이 움직이지 않음. 주요 장벽: ${sample.barriers.slice(0, 2).join(", ")}.${reason}`,
      related_persona_ids: stuck.slice(0, 3).map((p) => p.id),
    });
  }

  // 6. 카피 / 메시지 인사이트
  const allExposures: Exposure[] = [];
  for (const arr of agg.exposuresByPersona.values()) allExposures.push(...arr);
  if (allExposures.length >= 4) {
    const advanced = allExposures.filter(
      (e) => e.funnel_stage_before !== e.funnel_stage_after,
    );
    if (advanced.length > 0) {
      const sampleMsg = advanced[Math.floor(advanced.length / 2)]?.message_received;
      if (sampleMsg) {
        cards.push({
          id: "ins-message",
          kind: "message",
          title: "전환에 성공한 메시지 패턴",
          body: `funnel 을 끌어올린 노출에서 등장한 메시지: &ldquo;${sampleMsg.slice(0, 60)}${sampleMsg.length > 60 ? "…" : ""}&rdquo;. <em>표본 ${advanced.length}건 — 추세 추정용</em>.`,
        });
      }
    }
  }

  // 7. Mental Availability blocker — Sharp 의 핵심 진단
  // 노출은 많이 받았는데 진전이 약한 페르소나 = mental_availability gate 미통과 의심
  for (const p of personas) {
    const exposures = agg.exposuresByPersona.get(p.id) ?? [];
    if (exposures.length < 3) continue;
    const stage = agg.funnelByPersona.get(p.id) ?? "unaware";
    if (FUNNEL_META[stage].progress >= 0.3) continue; // 이미 진전된 페르소나 제외

    const ma = getMentalAvailability(
      p,
      // 어느 카테고리든 우리 product 카테고리는 외부 변수 — 첫 exposure 의 product_id 로 추정 불가
      // 단순화: category_preferences 의 첫 key 사용 (시뮬 대상 카테고리일 가능성 높음)
      Object.keys(p._sim.category_preferences)[0] ?? "",
    );
    if (ma < 0.35) {
      cards.push({
        id: `ins-ma-blocker-${p.id}`,
        kind: "behavior",
        title: `${p.basic.name} — Mental Availability 차단`,
        body: `${exposures.length}회 노출에도 ${FUNNEL_META[stage].label} 머묾. <em>Byron Sharp Mental Availability</em> 추정 ${(ma * 100).toFixed(0)}% — 카테고리 내 brand recall 부재. <em>Distinctive Brand Assets (색·캐릭터·태그라인)</em> 강화로 장기 기억 형성 필요.`,
        related_persona_ids: [p.id],
      });
      break; // 1개만 노출 (페르소나 많아도 너무 카드 폭주 X)
    }
  }

  // 8. MTA 비교 — 동일 funnel 전환에 last/first/linear/time-decay 가 어떻게 다른 결론 내는지
  const mtaInsight = computeMtaComparisonInsight(agg);
  if (mtaInsight) cards.push(mtaInsight);

  // 9. 표본 크기 disclaimer — 다른 인사이트가 있을 때만 caveat 으로 첨부.
  //    분석 전 (N=0) 단독 표시하면 어색하므로, 빈 카드 리스트인 경우 생략.
  if (
    cards.length > 0 &&
    (personas.length < 5 || allExposures.length < 10)
  ) {
    cards.push({
      id: "ins-sample-size",
      kind: "behavior",
      title: "추정 한계 — 표본 크기 작음",
      body: `본 시뮬은 ${personas.length}명 페르소나 × ${allExposures.length}회 노출 (N=${allExposures.length}). 실제 시장 추정엔 부족. <em>Counterfactual baseline (광고 없음 시 funnel) 비교 + Monte Carlo 다중 시뮬</em> 필요.`,
    });
  }

  return cards;
}

// ─────────────────────────────────────────────────
// MTA — 채널 효과 attribution 비교
// ─────────────────────────────────────────────────

function computeMtaComparisonInsight(agg: AggregatedData): InsightCard | null {
  // 모든 funnel 전환 이벤트 수집
  type Transition = {
    personaId: string;
    conversionIso: string;
    sequence: Array<{ channel: MediaChannel; timestampIso: string }>;
  };
  const transitions: Transition[] = [];
  for (const [personaId, exposures] of agg.exposuresByPersona) {
    const sorted = [...exposures].sort((a, b) =>
      a.sim_timestamp.localeCompare(b.sim_timestamp),
    );
    const sequence: Array<{ channel: MediaChannel; timestampIso: string }> = [];
    for (const e of sorted) {
      sequence.push({ channel: e.channel, timestampIso: e.sim_timestamp });
      if (e.funnel_stage_before !== e.funnel_stage_after) {
        transitions.push({
          personaId,
          conversionIso: e.sim_timestamp,
          sequence: [...sequence],
        });
      }
    }
  }
  if (transitions.length < 2) return null;

  const models: AttributionModel[] = ["last_touch", "first_touch", "linear", "time_decay"];
  const modelLabels: Record<AttributionModel, string> = {
    last_touch: "Last-Touch",
    first_touch: "First-Touch",
    linear: "Linear",
    time_decay: "Time-Decay",
  };
  const winnerByModel: Record<AttributionModel, MediaChannel | null> = {
    last_touch: null,
    first_touch: null,
    linear: null,
    time_decay: null,
  };
  for (const model of models) {
    const total: Partial<Record<MediaChannel, number>> = {};
    for (const t of transitions) {
      const credits = computeAttribution(t.sequence, t.conversionIso, model);
      for (const [ch, c] of Object.entries(credits)) {
        total[ch as MediaChannel] = (total[ch as MediaChannel] ?? 0) + c;
      }
    }
    let topCh: MediaChannel | null = null;
    let topVal = -1;
    for (const [ch, v] of Object.entries(total)) {
      if (v > topVal) {
        topVal = v;
        topCh = ch as MediaChannel;
      }
    }
    winnerByModel[model] = topCh;
  }

  // 모델별 winner 가 다르면 흥미로운 인사이트 — 같은 데이터, 다른 결론
  const uniqueWinners = new Set(Object.values(winnerByModel).filter(Boolean));
  if (uniqueWinners.size <= 1) {
    // 모든 모델이 동의 — 신뢰성 있는 winner
    const winner = winnerByModel.last_touch;
    if (!winner) return null;
    return {
      id: "ins-mta-consensus",
      kind: "reach",
      title: `${CHANNEL_META[winner].label} — 4개 attribution 모델 모두 동의`,
      body: `Last-Touch / First-Touch / Linear / Time-Decay 모두 <strong>${CHANNEL_META[winner].label}</strong> 을 최고 기여 채널로 지목. 결론 신뢰성 높음.`,
      related_channels: [winner],
    };
  }
  const lines = models
    .map((m) => {
      const ch = winnerByModel[m];
      return ch ? `${modelLabels[m]}: <strong>${CHANNEL_META[ch].label}</strong>` : null;
    })
    .filter(Boolean)
    .join(" · ");
  return {
    id: "ins-mta-disagree",
    kind: "reach",
    title: `Attribution 모델별 채널 평가 차이`,
    body: `같은 데이터, 다른 결론: ${lines}. <em>Multi-Touch Attribution</em> 모델 선택이 의사결정 좌우 — 단일 결론 단정 위험.`,
  };
}
