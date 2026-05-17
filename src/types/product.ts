// Product / Campaign — 마케터가 입력하는 시뮬레이션 대상
// Plan: /Users/yuhitomi/.claude/plans/cozy-skipping-reef.md §4-1

import type { MediaChannel } from "./persona";

export interface ProductChannelPlan {
  channel: MediaChannel;
  spend_share: number; // 0-1, 합 = 1.0
  creative_summary: string;
  targeting?: {
    age_range?: [number, number];
    regions?: string[];
    interests?: string[];
  };
}

/**
 * Byron Sharp 의 Distinctive Brand Assets (DBA).
 * 페르소나가 0.2초 안에 브랜드를 인식하게 만드는 감각 신호.
 * 시뮬에서: 노출 1회마다 페르소나의 mental_availability +α 누적
 *           (DBA 가 많을수록 인지 강화 빠름).
 */
export interface DistinctiveBrandAssets {
  /** 시그니처 컬러 — 예: "코카콜라 빨강", "캐롯 노랑" */
  color?: string;
  /** 캐릭터·마스코트 — 예: "맥도날드 로날드", "두꺼비 (진로)" */
  mascot?: string;
  /** 시그니처 카피·태그라인 — 예: "I'm lovin' it" */
  tagline?: string;
  /** 효과음·징글 — 예: "Intel inside 사운드" */
  sound?: string;
  /** 패키지·UI 패턴 등 기타 — 자유 텍스트 */
  other?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price_krw: number;
  positioning: string;
  unique_value_props: string[];
  channels: ProductChannelPlan[];
  competitor_brands: string[];
  brand_color?: string; // Exposure 카드 강조 색
  /** Sharp DBA — 마케터가 직접 입력 (선택). Mental Availability 누적에 영향 */
  distinctive_assets?: DistinctiveBrandAssets;
}
