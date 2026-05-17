// 박지영(persona-park-jiyoung) 의 시뮬레이션 1일치 stream.
// Lumi Cashback 카드(prod-cashback-card-01) 캠페인 노출 포함.
// Phase 3 (시뮬레이션 재생 UI) 의 setInterval push 대상.

import type {
  Exposure,
  FunnelTransition,
  LifeEntry,
  FeedEntry,
} from "@/types";

const P = "persona-park-jiyoung";
const PROD = "prod-cashback-card-01";

const life: LifeEntry[] = [
  {
    id: "le-pj-001",
    persona_id: P,
    sim_timestamp: "2026-05-16T07:00:00",
    type: "routine",
    diary: "둘째 아이 깨우고 아침 준비. 오늘은 김밥. 시간 없다.",
    action_summary: "기상, 아이 등원 준비",
    emotion: { valence: 0.2, arousal: 0.5 },
    location: "집 (강서구)",
  },
  {
    id: "le-pj-002",
    persona_id: P,
    sim_timestamp: "2026-05-16T07:45:00",
    type: "routine",
    diary: "지하철 5호선. 출근길은 인스타 시간. 육아 계정 몇 개 새로 떴네.",
    action_summary: "출근 지하철 탑승, 인스타그램 스크롤 시작",
    emotion: { valence: 0.3, arousal: 0.4 },
    location: "5호선 화곡역",
  },
  {
    id: "le-pj-003",
    persona_id: P,
    sim_timestamp: "2026-05-16T08:30:00",
    type: "work",
    diary: "교무실 도착. 동료 선생님이 새 카드 자랑. 또 카드 얘기야.",
    action_summary: "출근, 동료와 인사",
    emotion: { valence: 0.25, arousal: 0.4 },
    location: "강서초등학교 교무실",
  },
  {
    id: "le-pj-004",
    persona_id: P,
    sim_timestamp: "2026-05-16T10:30:00",
    type: "consumption",
    diary: "1교시 끝나고 스타벅스 아메리카노. 5천원이 매일 모이면 한 달 15만원이라는데...",
    action_summary: "스타벅스 아메리카노 4,500원 결제",
    emotion: { valence: 0.4, arousal: 0.5 },
    location: "스타벅스 강서구청점",
    spend: { category: "카페", amount: 4500, currency: "KRW", brand: "스타벅스" },
  },
  {
    id: "le-pj-005",
    persona_id: P,
    sim_timestamp: "2026-05-16T12:30:00",
    type: "social",
    diary: "점심 동료 셋이 함께. 김선생이 '나 그 카드 바꿨다니까?' 또 그 얘기.",
    action_summary: "동료와 점심, 카드 추천 대화",
    emotion: { valence: 0.4, arousal: 0.45 },
    location: "교무실 근처 한식당",
    spend: { category: "외식", amount: 9000, currency: "KRW" },
  },
  {
    id: "le-pj-006",
    persona_id: P,
    sim_timestamp: "2026-05-16T15:00:00",
    type: "work",
    diary: "5교시. 아이들이 시끄러워. 머리 아프다.",
    action_summary: "5교시 수업",
    emotion: { valence: -0.1, arousal: 0.65 },
    location: "교실",
  },
  {
    id: "le-pj-007",
    persona_id: P,
    sim_timestamp: "2026-05-16T18:00:00",
    type: "routine",
    diary: "퇴근. 지하철에서 또 인스타. 광고 자주 보이네.",
    action_summary: "퇴근 지하철, 인스타 스크롤",
    emotion: { valence: 0.2, arousal: 0.35 },
    location: "지하철 5호선",
  },
  {
    id: "le-pj-008",
    persona_id: P,
    sim_timestamp: "2026-05-16T19:30:00",
    type: "consumption",
    diary: "마트에서 저녁거리. 두부, 야채, 우유. 카드값 또 늘어나네.",
    action_summary: "마트에서 식재료 구매",
    emotion: { valence: 0.1, arousal: 0.4 },
    location: "이마트 가양점",
    spend: { category: "식료품", amount: 47000, currency: "KRW" },
  },
  {
    id: "le-pj-009",
    persona_id: P,
    sim_timestamp: "2026-05-16T21:00:00",
    type: "leisure",
    diary: "아이 재우고 거실. 유튜브에 또 그 카드 광고. 호기심 생긴다.",
    action_summary: "아이 취침 후 거실, 유튜브 시청",
    emotion: { valence: 0.45, arousal: 0.4 },
    location: "집 거실",
  },
  {
    id: "le-pj-010",
    persona_id: P,
    sim_timestamp: "2026-05-16T22:00:00",
    type: "reflection",
    diary: "남편이 옆에서 핸드폰. 나도 검색해볼까. '캐시백 카드 추천'.",
    action_summary: "네이버에서 캐시백 카드 검색",
    emotion: { valence: 0.5, arousal: 0.55 },
    location: "집 침실",
    related_exposure_ids: ["ex-pj-003", "ex-pj-005", "ex-pj-006"],
  },
  {
    id: "le-pj-011",
    persona_id: P,
    sim_timestamp: "2026-05-16T23:00:00",
    type: "reflection",
    diary: "오늘 카드 광고 너무 많이 봤다. 내일 동료한테 물어봐야지. 신한카드도 5년 썼는데 진짜 바꿔야 하나?",
    action_summary: "취침 전 생각 정리",
    emotion: { valence: 0.4, arousal: 0.3 },
    location: "집 침실",
  },
];

const exposures: Exposure[] = [
  {
    id: "ex-pj-001",
    persona_id: P,
    product_id: PROD,
    sim_timestamp: "2026-05-16T07:55:00",
    channel: "instagram",
    context: "출근길 지하철, 육아 콘텐츠 사이에 끼어든 광고",
    attention_level: 0.25,
    prior_exposure_count: 0,
    message_received: "MZ 직장인 카드 — 월 5만원 캐시백",
    funnel_stage_before: "unaware",
    funnel_stage_after: "aware",
    internal_reasoning:
      "또 카드 광고. 근데 '월 5만원' 이라는 숫자가 눈에 들어왔어. 평소 같으면 그냥 넘겼을 텐데.",
    emotional_response: { valence: 0.15, arousal: 0.35 },
    action_taken: "ignore",
  },
  {
    id: "ex-pj-002",
    persona_id: P,
    product_id: PROD,
    sim_timestamp: "2026-05-16T10:32:00",
    channel: "subway_ad",
    context: "스타벅스 가는 길 지하철 스크린도어",
    attention_level: 0.3,
    prior_exposure_count: 1,
    message_received: "연 60만원 돌려받기",
    funnel_stage_before: "aware",
    funnel_stage_after: "aware",
    internal_reasoning: "어제도 본 거 같은데. 60만원이면 한 달에 5만원이네. 진짜?",
    emotional_response: { valence: 0.2, arousal: 0.4 },
    action_taken: "ignore",
  },
  {
    id: "ex-pj-003",
    persona_id: P,
    product_id: PROD,
    sim_timestamp: "2026-05-16T12:45:00",
    channel: "word_of_mouth",
    context: "점심 동료의 자발적 추천",
    attention_level: 0.85,
    prior_exposure_count: 2,
    message_received:
      "동료 김선생: '나 이 카드 바꿨거든. 한 달에 진짜 5만원 캐시백 들어옴. 스타벅스도 10% 더 깎이고.'",
    funnel_stage_before: "aware",
    funnel_stage_after: "interested",
    internal_reasoning:
      "김선생이 직접 쓴다고? 광고로만 보던 거랑 다르네. 진짜인가봐. 내가 매일 가는 스타벅스도 더 깎인다고 했어.",
    emotional_response: { valence: 0.65, arousal: 0.55 },
    action_taken: "ask_friend",
  },
  {
    id: "ex-pj-004",
    persona_id: P,
    product_id: PROD,
    sim_timestamp: "2026-05-16T18:10:00",
    channel: "instagram",
    context: "퇴근길 인스타 피드",
    attention_level: 0.55,
    prior_exposure_count: 3,
    message_received: "워킹맘 vlog 협찬 — 한 달 사용 정산 인증",
    funnel_stage_before: "interested",
    funnel_stage_after: "interested",
    internal_reasoning:
      "어, 또 그 카드네. 김선생 말이랑 똑같은 얘기. 워킹맘이 6주 쓰고 5.2만원 캐시백 받았다고 영수증까지 보여줘.",
    emotional_response: { valence: 0.55, arousal: 0.5 },
    action_taken: "save",
  },
  {
    id: "ex-pj-005",
    persona_id: P,
    product_id: PROD,
    sim_timestamp: "2026-05-16T21:15:00",
    channel: "youtube",
    context: "유튜브 시청 중 6초 bumper 광고",
    attention_level: 0.4,
    prior_exposure_count: 4,
    message_received: "출근길 vlog — '스타벅스 매일 한 잔, 한 달이면?'",
    funnel_stage_before: "interested",
    funnel_stage_after: "considering",
    internal_reasoning:
      "오늘 하루 동안만 이 카드를 다섯 번째 보네. 진짜 한 번 알아봐야 하는 거 아냐?",
    emotional_response: { valence: 0.6, arousal: 0.6 },
    action_taken: "save",
  },
  {
    id: "ex-pj-006",
    persona_id: P,
    product_id: PROD,
    sim_timestamp: "2026-05-16T22:05:00",
    channel: "naver_search",
    context: "본인이 직접 '캐시백 카드 추천' 검색",
    attention_level: 0.95,
    prior_exposure_count: 5,
    message_received: "재테크 블로거 후기 — 6개월 사용 캐시백 정산 인증",
    funnel_stage_before: "considering",
    funnel_stage_after: "intent",
    internal_reasoning:
      "블로거가 6개월치 적립 내역을 캡쳐로 보여주네. 26만원 캐시백. 진짜네. 지금 가입해볼까?",
    emotional_response: { valence: 0.75, arousal: 0.7 },
    action_taken: "click",
  },
];

const funnel: FunnelTransition[] = [
  {
    id: "ft-pj-001",
    persona_id: P,
    product_id: PROD,
    sim_timestamp: "2026-05-16T07:55:00",
    from_stage: "unaware",
    to_stage: "aware",
    trigger_exposure_id: "ex-pj-001",
    reasoning: "첫 노출. 구체적 금액('월 5만원')이 주의를 끔.",
  },
  {
    id: "ft-pj-002",
    persona_id: P,
    product_id: PROD,
    sim_timestamp: "2026-05-16T12:45:00",
    from_stage: "aware",
    to_stage: "interested",
    trigger_exposure_id: "ex-pj-003",
    reasoning: "신뢰하는 동료의 직접 추천 + 본인이 매일 가는 스타벅스 혜택 일치.",
  },
  {
    id: "ft-pj-003",
    persona_id: P,
    product_id: PROD,
    sim_timestamp: "2026-05-16T21:15:00",
    from_stage: "interested",
    to_stage: "considering",
    trigger_exposure_id: "ex-pj-005",
    reasoning: "하루 5회 반복 노출 — frequency 임계 도달. 호기심에서 검토로 전환.",
  },
  {
    id: "ft-pj-004",
    persona_id: P,
    product_id: PROD,
    sim_timestamp: "2026-05-16T22:05:00",
    from_stage: "considering",
    to_stage: "intent",
    trigger_exposure_id: "ex-pj-006",
    reasoning: "자발적 검색 + 객관적 후기(실적 캡쳐) 확인으로 신뢰 확보.",
  },
];

// 시간순으로 stream 정렬 — FeedEntry 형태
export const STREAM_PARK_JIYOUNG: FeedEntry[] = [
  ...life.map((data) => ({ kind: "life" as const, data })),
  ...exposures.map((data) => ({ kind: "exposure" as const, data })),
  ...funnel.map((data) => ({ kind: "funnel" as const, data })),
].sort((a, b) => {
  const ta = a.kind === "life" ? a.data.sim_timestamp
    : a.kind === "exposure" ? a.data.sim_timestamp
    : a.data.sim_timestamp;
  const tb = b.kind === "life" ? b.data.sim_timestamp
    : b.kind === "exposure" ? b.data.sim_timestamp
    : b.data.sim_timestamp;
  return ta.localeCompare(tb);
});

export const STREAM_PARK_JIYOUNG_RAW = { life, exposures, funnel };
