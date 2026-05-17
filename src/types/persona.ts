// Persona — UX 리서치 표준 템플릿 (8 sections) + 시뮬레이션 보조 필드(_sim).
// Plan: /Users/yuhitomi/.claude/plans/cozy-skipping-reef.md §4-1

export type DigitalLiteracy = "low" | "medium" | "high" | "expert";

export type MaritalStatus = "single" | "married" | "divorced" | "partnered";

export type HousingType =
  | "owned"
  | "rent_jeonse"
  | "rent_monthly"
  | "with_parents";

export type InnovationAdoption =
  | "innovator"
  | "early_adopter"
  | "early_majority"
  | "late_majority"
  | "laggard";

export type MediaChannel =
  | "instagram"
  | "youtube"
  | "tiktok"
  | "naver_search"
  | "google_search"
  | "kakao_talk"
  | "tv"
  | "subway_ad"
  | "outdoor_ad"
  | "word_of_mouth"
  | "blog_review"
  | "podcast"
  | "email"
  | "push_notification";

export interface MediaHabit {
  channel: MediaChannel;
  daily_minutes: number;
  receptivity_to_ads: number; // 0-1
}

export interface CategoryPreference {
  current_brand?: string;
  satisfaction: number; // 0-1
  willing_to_switch: number; // 0-1
}

export interface PersonaBasic {
  name: string;
  age_range: string; // "30대 초반"
  age_exact?: number;
  occupation: string;
  digital_literacy: DigitalLiteracy;
}

/**
 * Cialdini 6 영향력 원리에 대한 페르소나의 민감도 (0-1).
 * - 0 = 그 자극에 둔감
 * - 1 = 매우 민감 (해당 메시지로 funnel 빠르게 진전)
 *
 * 학문 근거: Cialdini, Influence (1984)
 */
export interface CialdiniSusceptibility {
  /** 입소문·리뷰·"N명 사용중" 등 사회 증명 */
  social_proof: number;
  /** 전문가·기관·인증·뉴스 */
  authority: number;
  /** 한정 수량·마감 시간·품절 임박 */
  scarcity: number;
  /** 무료 제공·샘플·선물 */
  reciprocity: number;
  /** 친근한 캐릭터·연예인·비주얼 */
  liking: number;
  /** 이미 시작한 행동의 연속 (앱 회원가입 후 결제 등) */
  consistency: number;
}

/**
 * Kahneman 의 Dual-process 모델 — 페르소나의 평상시 의사결정 모드.
 * - system1: 빠른·직관적·정서적 (대부분 일상 소비)
 * - system2: 느린·분석적·신중 (고관여 카테고리)
 *
 * 시간대 cognitive load 가 동적으로 override 가능 (출근길 = system1 강제).
 */
export type CognitiveProcessingDefault = "system1" | "system2";

export interface PersonaSimFields {
  marital_status: MaritalStatus;
  children_count: number;
  children_ages: number[];
  household_size: number;
  housing: HousingType;
  region: { city: string; district: string };
  income_monthly_krw: number;
  income_decile: number; // 1-10
  price_sensitivity: number; // 0-1
  brand_loyalty: number; // 0-1
  media_channels: MediaHabit[];
  innovation_adoption: InnovationAdoption;
  category_preferences: Record<string, CategoryPreference>;

  // ───── 마케팅·심리 grounding (§9 plan) ─────
  // 신규 필드 — POC 전환기엔 optional. 미설정 시 marketing-engine 이 합리적 default 사용.

  /** Cialdini 6 원리 susceptibility — 광고 메시지 신호별 반응 강도 */
  cialdini_susceptibility?: CialdiniSusceptibility;

  /** Dual-process 디폴트 모드 — internal_reasoning 톤·길이에 영향 */
  cognitive_processing_default?: CognitiveProcessingDefault;

  /**
   * 카테고리별 관여도 (Petty-Cacioppo ELM).
   * 0=낮은 관여(peripheral route 활성), 1=고관여(central route — 신중·비교)
   * 카테고리 key 는 category_preferences 와 동일 어휘 사용 (예: "신용카드").
   */
  involvement_by_category?: Record<string, number>;

  /**
   * Byron Sharp Mental Availability — 해당 카테고리에서
   * 페르소나가 떠올리는 브랜드 풀의 깊이 (0=공백, 1=풍부).
   */
  mental_availability_by_category?: Record<string, number>;

  /** Kahneman-Tversky 손실 회피 (0-1) */
  loss_aversion?: number;
  /** 첫 가격·숫자 정박 효과 (0-1) */
  anchoring_susceptibility?: number;
  /** 현 상태 유지 선호 (0-1) */
  status_quo_bias?: number;
}

export interface PersonaCurrentState {
  sim_timestamp: string;
  mood: { valence: number; arousal: number };
  energy: number; // 0-1
  balance_krw: number;
  open_intents: string[];
  /**
   * McKinsey CDJ — 카테고리별 considered brand set.
   * 시뮬 중 페르소나가 어떤 카테고리에서 "구매 시 떠올릴 브랜드 풀" 에 우리 제품을 넣었는지 추적.
   * Sharp Mental Availability gate 통과 시에만 진입.
   */
  considered_brands_by_category?: Record<string, string[]>;
}

export interface Persona {
  id: string;

  // [기본 정보]
  basic: PersonaBasic;

  // [목표]
  goals: string[];

  // [Pain Point]
  pain_points: string[];

  // [행동 패턴]
  behaviors: string[];

  // [행동 트리거]
  triggers: string[];

  // [장벽]
  barriers: string[];

  // [반응하는 메시지]
  resonating_messages: string[];

  // [기대 경험]
  expected_experience: string[];

  // [성공 조건]
  success_criteria: string[];

  // 시뮬레이션 보조 (UI 에서는 접힘)
  _sim: PersonaSimFields;

  // 시뮬 중 변하는 상태
  current_state: PersonaCurrentState;
}
