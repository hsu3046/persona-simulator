// Simulation — Exposure, LifeEntry, FunnelTransition, Interview
// Plan: /Users/yuhitomi/.claude/plans/cozy-skipping-reef.md §4-1

import type { MediaChannel } from "./persona";

export type FunnelStage =
  | "unaware"
  | "aware"
  | "interested"
  | "considering"
  | "intent"
  | "trial"
  | "purchase"
  | "repeat"
  | "advocate"
  | "churned";

export type ExposureAction =
  | "ignore"
  | "click"
  | "save"
  | "search"
  | "ask_friend"
  | "visit_store"
  | "purchase";

export interface Emotion {
  valence: number; // -1 to 1
  arousal: number; // 0-1
}

// Marketing reach unit — 페르소나가 제품에 도달한 1 회 사건
export interface Exposure {
  id: string;
  persona_id: string;
  product_id: string;
  sim_timestamp: string;
  channel: MediaChannel;
  context: string; // "출근길 지하철에서 무심코"
  attention_level: number; // 0-1
  prior_exposure_count: number;
  message_received: string;
  funnel_stage_before: FunnelStage;
  funnel_stage_after: FunnelStage;
  internal_reasoning: string; // ⭐ 1인칭 사고
  emotional_response: Emotion;
  action_taken?: ExposureAction;
}

export type LifeEntryType =
  | "routine"
  | "work"
  | "consumption"
  | "social"
  | "leisure"
  | "reflection";

// 일반 라이프 로그 — 광고/노출과 분리. Exposure 와 cross-link 가능
export interface LifeEntry {
  id: string;
  persona_id: string;
  sim_timestamp: string;
  type: LifeEntryType;
  diary: string; // 1인칭 일기
  action_summary: string; // 3인칭 요약
  emotion: Emotion;
  location?: string;
  spend?: {
    category: string;
    amount: number;
    currency: string;
    brand?: string;
  };
  related_exposure_ids?: string[];
}

// Funnel 단계 전환 기록
export interface FunnelTransition {
  id: string;
  persona_id: string;
  product_id: string;
  sim_timestamp: string;
  from_stage: FunnelStage;
  to_stage: FunnelStage;
  trigger_exposure_id?: string;
  reasoning: string;
}

// 시점 인터뷰
export interface Interview {
  id: string;
  persona_id: string;
  sim_timestamp: string;
  product_id?: string;
  question: string;
  retrieved_entries: {
    life: string[];
    exposures: string[];
  };
  answer: string;
}

// ───── UI 보조 타입 ─────

// Feed 에 카드로 표시될 수 있는 모든 엔트리 (Life or Exposure)
export type FeedEntry =
  | { kind: "life"; data: LifeEntry }
  | { kind: "exposure"; data: Exposure }
  | { kind: "funnel"; data: FunnelTransition };

export type SimSpeed = 1 | 4 | 24;

// 인사이트 패널용 narrative
export interface InsightCard {
  id: string;
  title: string;
  body: string;
  kind: "reach" | "funnel" | "behavior" | "message";
  related_persona_ids?: string[];
  related_channels?: MediaChannel[];
}
