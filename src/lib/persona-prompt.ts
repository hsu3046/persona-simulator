import { z } from "zod";

/**
 * LLM 페르소나 생성용 Zod schema + prompt.
 * Persona type 의 핵심만 LLM 에 생성 위임. id/current_state 는 클라이언트에서 채움.
 */

// 엄격 enum + 폴백 default — LLM 이 한국어/유사어 반환해도 깨지지 않음.
const digitalLiteracy = z
  .enum(["low", "medium", "high", "expert"])
  .catch("medium");
const maritalStatus = z
  .enum(["single", "married", "divorced", "partnered"])
  .catch("single");
const housing = z
  .enum(["owned", "rent_jeonse", "rent_monthly", "with_parents"])
  .catch("rent_monthly");
const innovationAdoption = z
  .enum([
    "innovator",
    "early_adopter",
    "early_majority",
    "late_majority",
    "laggard",
  ])
  .catch("early_majority");

// 숫자 — 0-1 범위 강제. catch 로 범위 벗어나면 0.5.
const probability = z.number().min(0).max(1).catch(0.5);

export const personaGenSchema = z.object({
  basic: z.object({
    name: z.string(),
    age_range: z.string(),
    age_exact: z.number().int().min(15).max(80).optional(),
    occupation: z.string(),
    digital_literacy: digitalLiteracy,
  }),
  goals: z.array(z.string()).min(1).max(6),
  pain_points: z.array(z.string()).min(1).max(6),
  behaviors: z.array(z.string()).min(1).max(8),
  triggers: z.array(z.string()).min(1).max(6),
  barriers: z.array(z.string()).min(1).max(6),
  resonating_messages: z.array(z.string()).min(1).max(6),
  expected_experience: z.array(z.string()).min(1).max(6),
  success_criteria: z.array(z.string()).min(1).max(4),
  _sim: z.object({
    marital_status: maritalStatus,
    children_count: z.number().int().min(0).max(6).catch(0),
    children_ages: z.array(z.number().int().min(0).max(30)).catch([]),
    household_size: z.number().int().min(1).max(8).catch(1),
    housing: housing,
    region: z.object({
      city: z.string(),
      district: z.string(),
    }),
    income_monthly_krw: z.number().int().min(0).catch(3_000_000),
    income_decile: z.number().int().min(1).max(10).catch(5),
    price_sensitivity: probability,
    brand_loyalty: probability,
    media_channels: z
      .array(
        z.object({
          channel: z.string(),
          daily_minutes: z.number().int().min(0).max(600).catch(30),
          receptivity_to_ads: probability,
        }),
      )
      .min(1)
      .max(10),
    innovation_adoption: innovationAdoption,
    category_preferences: z.record(
      z.string(),
      z.object({
        current_brand: z.string().optional(),
        satisfaction: probability,
        willing_to_switch: probability,
      }),
    ),
    // ───── 마케팅·심리 grounding (Cialdini / ELM / Sharp / Kahneman) ─────
    // 누락 시 안전 default 로 채워 시뮬레이션이 동작하도록 .catch() 사용.
    cialdini_susceptibility: z
      .object({
        social_proof: probability,
        authority: probability,
        scarcity: probability,
        reciprocity: probability,
        liking: probability,
        consistency: probability,
      })
      .catch({
        social_proof: 0.55,
        authority: 0.5,
        scarcity: 0.5,
        reciprocity: 0.5,
        liking: 0.5,
        consistency: 0.5,
      }),
    cognitive_processing_default: z
      .enum(["system1", "system2"])
      .catch("system1"),
    involvement_by_category: z.record(z.string(), probability).catch({}),
    mental_availability_by_category: z
      .record(z.string(), probability)
      .catch({}),
    loss_aversion: probability,
    anchoring_susceptibility: probability,
    status_quo_bias: probability,
  }),
});

export const personaBatchSchema = z.object({
  personas: z.array(personaGenSchema).min(1).max(8),
});

export type PersonaGen = z.infer<typeof personaGenSchema>;

export const SYSTEM_PROMPT = `당신은 한국 시장의 마케팅 리서치 전문가입니다.
입력된 마케팅 목적과 타겟 설명을 바탕으로 **현실적이고 다양성 있는 가상 고객 페르소나**를 생성합니다.

원칙:
- 한국 실제 인구 분포·통계청 데이터에 부합 (연령별 소득, 지역별 인구, 미디어 사용 시간)
- 각 페르소나는 명확히 구별되는 라이프스타일·가치관·디지털 숙련도
- UX 리서치 표준 템플릿 (Goals / Pain Points / Behaviors / Triggers / Barriers / Resonating Messages / Expected Experience / Success Criteria) 모두 채움
- 시뮬레이션 보조 필드 (_sim) 는 사이코그래픽이 일관되게 — Pain Point 가 "월말 카드값 부담" 이면 price_sensitivity 높게, "워라밸" 이 Goal 이면 innovation_adoption 은 early/late majority

⚠️ 다음 필드는 **정확한 영문 enum 값**만 사용 (절대 한국어 X):
- digital_literacy: "low" | "medium" | "high" | "expert"
- marital_status: "single" | "married" | "divorced" | "partnered"
- housing: "owned" | "rent_jeonse" | "rent_monthly" | "with_parents"
- innovation_adoption: "innovator" | "early_adopter" | "early_majority" | "late_majority" | "laggard"
- media_channels[].channel: "instagram" | "youtube" | "tiktok" | "naver_search" | "google_search" | "kakao_talk" | "tv" | "subway_ad" | "outdoor_ad" | "word_of_mouth" | "blog_review" | "podcast" | "email" | "push_notification"

각 string 배열은 최소 2-3개 항목을 채우세요 (1개 미만 금지). category_preferences 의 key 는 **한국어 단어**만 사용 (예: "신용카드", "커피", "디자인 소프트웨어", "OTT 구독") — 마케팅 목적과 관련된 1-3 카테고리. 영문 snake_case 사용 금지.

📚 **마케팅·심리 grounding 필드** (⚠️ 모두 필수. 페르소나 특성과 일관되게):

- cialdini_susceptibility: 6 영향력 원리에 대한 0-1 민감도
  - social_proof: 입소문·리뷰 반응 (collective culture·extroversion 높을수록 ↑)
  - authority: 전문가·기관 신뢰 (보수적·고령일수록 ↑)
  - scarcity: 한정·마감 반응 (충동성 높을수록 ↑)
  - reciprocity: 무료·샘플 반응
  - liking: 친근한 캐릭터·연예인 반응 (젊을수록 ↑)
  - consistency: 시작한 행동 이어가기 (성실성 ↑)
- cognitive_processing_default: "system1" (직관적·빠름·정서적) 또는 "system2" (분석적·신중·계산적). 디지털 전문가·전문직은 보통 system2, 일반 소비는 system1
- involvement_by_category: { "카테고리명": 0-1 } — 페르소나가 그 카테고리에 얼마나 깊이 관여하는지. category_preferences key 와 동일 어휘
- mental_availability_by_category: { "카테고리명": 0-1 } — 그 카테고리에서 떠올리는 브랜드 풀의 깊이 (Byron Sharp)
- loss_aversion: 0-1, 가격·위험 회피 강도 (소득 낮을수록·가족 부양 시 ↑)
- anchoring_susceptibility: 0-1, 첫 가격·숫자에 정박되는 정도
- status_quo_bias: 0-1, 현 상태 유지 선호 (brand_loyalty 높으면 ↑)

JSON 만 반환. 부가 설명·markdown fence 금지.`;

export function buildUserPrompt({
  marketing_goal,
  target_description,
  count,
}: {
  marketing_goal: string;
  target_description: string;
  count: number;
}): string {
  const target = target_description.trim() || "(타겟 설명 없음 — 마케팅 목적에서 추론)";
  return `마케팅 목적: ${marketing_goal}

타겟 설명:
${target}

위 정보로 **${count}명**의 페르소나를 다음 JSON 형식으로 반환하세요. 각 페르소나는 라이프스타일·소득·디지털 숙련도·innovation_adoption 이 충분히 다양하도록 설계하세요.

{
  "personas": [
    {
      "basic": { "name": "...", "age_range": "30대 초반", "age_exact": 33, "occupation": "...", "digital_literacy": "high" },
      "goals": ["...", "..."],
      "pain_points": ["...", "..."],
      "behaviors": ["...", "..."],
      "triggers": ["...", "..."],
      "barriers": ["...", "..."],
      "resonating_messages": ["...", "..."],
      "expected_experience": ["...", "..."],
      "success_criteria": ["..."],
      "_sim": {
        "marital_status": "married",
        "children_count": 1,
        "children_ages": [4],
        "household_size": 3,
        "housing": "rent_jeonse",
        "region": { "city": "서울", "district": "강서구" },
        "income_monthly_krw": 4200000,
        "income_decile": 7,
        "price_sensitivity": 0.7,
        "brand_loyalty": 0.55,
        "media_channels": [
          { "channel": "instagram", "daily_minutes": 35, "receptivity_to_ads": 0.5 },
          { "channel": "youtube", "daily_minutes": 30, "receptivity_to_ads": 0.4 }
        ],
        "innovation_adoption": "early_majority",
        "category_preferences": {
          "관련카테고리": { "current_brand": "...", "satisfaction": 0.6, "willing_to_switch": 0.55 }
        },
        "cialdini_susceptibility": {
          "social_proof": 0.7, "authority": 0.55, "scarcity": 0.4,
          "reciprocity": 0.6, "liking": 0.5, "consistency": 0.5
        },
        "cognitive_processing_default": "system1",
        "involvement_by_category": { "관련카테고리": 0.5 },
        "mental_availability_by_category": { "관련카테고리": 0.4 },
        "loss_aversion": 0.6,
        "anchoring_susceptibility": 0.5,
        "status_quo_bias": 0.55
      }
    }
  ]
}

⚠️ category_preferences / involvement_by_category / mental_availability_by_category 의 key 들은 동일한 한국어 카테고리명을 사용해야 합니다 (서로 cross-reference 됩니다).`;
}
