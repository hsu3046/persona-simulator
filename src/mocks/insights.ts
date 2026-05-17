import type { InsightCard } from "@/types";

// Phase 5 (인사이트 패널) mock — LLM 으로 생성될 narrative 의 샘플
export const MOCK_INSIGHTS: InsightCard[] = [
  {
    id: "ins-001",
    kind: "reach",
    title: "5회 노출 임계점에서 funnel 전환",
    body: "박지영 페르소나는 6시간 동안 6회 노출된 후 considering → intent 로 전환되었습니다. 첫 노출은 ignore, 5번째 노출에서 save, 6번째(검색)에서 click. 광고 빈도가 결정적이었음.",
    related_persona_ids: ["persona-park-jiyoung"],
  },
  {
    id: "ins-002",
    kind: "behavior",
    title: "동료 추천이 단일 광고보다 4배 효과",
    body: "instagram 단일 노출의 attention level 평균 0.4 vs 동료 word-of-mouth attention 0.85. funnel 단계 변화도 word-of-mouth 가 1단계 점프, 광고는 0~0.5 단계.",
    related_persona_ids: ["persona-park-jiyoung"],
    related_channels: ["word_of_mouth", "instagram"],
  },
  {
    id: "ins-003",
    kind: "message",
    title: "구체적 숫자가 marketers' attention magnet",
    body: "'월 5만원', '연 60만원', '6개월 26만원 정산' 등 구체적 금액이 포함된 메시지에서 internal_reasoning 길이가 평균 2.3 배 길어짐 — 페르소나가 실제로 머릿속 시뮬레이션 수행.",
    related_persona_ids: ["persona-park-jiyoung"],
  },
  {
    id: "ins-004",
    kind: "funnel",
    title: "subway_ad 는 attention 낮으나 reinforcement 효과",
    body: "지하철 광고 단독으로는 funnel 전환 X. 하지만 다른 채널 노출 사이 reinforce 역할 수행 — '어제도 본 것 같다' 인지가 동료 추천 신뢰도를 31% 상승시킴.",
    related_channels: ["subway_ad", "word_of_mouth"],
  },
];
