import type { Product } from "@/types";

// MVP 시나리오: MZ 직장인 캐시백 신용카드 캠페인
export const MOCK_PRODUCT: Product = {
  id: "prod-cashback-card-01",
  name: "Lumi Cashback 카드",
  category: "신용카드",
  price_krw: 0, // 연회비 무료
  positioning: "MZ 직장인을 위한 일상 캐시백 카드",
  unique_value_props: [
    "연회비 평생 무료",
    "스타벅스·이디야 10% 캐시백",
    "교통비 5% 자동 적립",
    "월 최대 5만원 한도",
  ],
  brand_color: "#FF8A65",
  channels: [
    {
      channel: "instagram",
      spend_share: 0.35,
      creative_summary: "20-30대 직장인 일상 + '월 5만원 더' 카피, 핑크-오렌지 그라데이션",
      targeting: { age_range: [25, 39], regions: ["서울", "경기"] },
    },
    {
      channel: "youtube",
      spend_share: 0.25,
      creative_summary: "출근길 vlog 광고 6초 bumper — '스타벅스 매일 한 잔, 한 달이면?'",
      targeting: { age_range: [25, 39] },
    },
    {
      channel: "subway_ad",
      spend_share: 0.15,
      creative_summary: "지하철 2호선 강남/역삼/선릉 스크린도어 — 큰 글씨 '연 60만원 돌려받기'",
      targeting: { regions: ["서울"] },
    },
    {
      channel: "naver_search",
      spend_share: 0.1,
      creative_summary: "'캐시백 카드 추천' 검색어 파워링크",
    },
    {
      channel: "word_of_mouth",
      spend_share: 0.1,
      creative_summary: "친구 추천 시 양쪽 1만원 즉시 적립",
    },
    {
      channel: "blog_review",
      spend_share: 0.05,
      creative_summary: "재테크 블로거 후기 — 6개월 사용 캐시백 정산 인증",
    },
  ],
  competitor_brands: ["현대카드 ZERO Edition2", "토스 카드", "삼성 iD ON"],
};
