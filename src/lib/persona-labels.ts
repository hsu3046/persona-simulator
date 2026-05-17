// 페르소나의 enum/숫자 값을 한국어 라벨로 변환.
// 카드 배지·시트 헤더·인사이트 narrative 등에서 공통 사용.

import type {
  DigitalLiteracy,
  HousingType,
  InnovationAdoption,
  MaritalStatus,
} from "@/types";

export const LITERACY_LABEL: Record<DigitalLiteracy, string> = {
  low: "디지털 낮음",
  medium: "디지털 보통",
  high: "디지털 능숙",
  expert: "디지털 전문가",
};

// Rogers 의 5단계 신제품 수용 곡선 — 한국어 라벨 + 짧은 설명.
export const INNOVATION_LABEL: Record<InnovationAdoption, string> = {
  innovator: "혁신가",
  early_adopter: "얼리어답터",
  early_majority: "조기 다수",
  late_majority: "후기 다수",
  laggard: "후발 수용",
};

export const INNOVATION_HINT: Record<InnovationAdoption, string> = {
  innovator: "신제품 출시 즉시 시도. 마케팅에 가장 빨리 반응.",
  early_adopter: "신제품 초기에 적극 시도. 영향력 큼.",
  early_majority: "검증 후 안전하게 수용. 추천·후기 중요.",
  late_majority: "대다수 사용 후에 합류. 가격·안전성 중요.",
  laggard: "변화에 보수적. 익숙한 것 선호.",
};

export const MARITAL_LABEL: Record<MaritalStatus, string> = {
  single: "미혼",
  married: "기혼",
  divorced: "이혼",
  partnered: "동거 파트너",
};

export const HOUSING_LABEL: Record<HousingType, string> = {
  owned: "자가",
  rent_jeonse: "전세",
  rent_monthly: "월세",
  with_parents: "부모와 거주",
};

// ── 소득 분위 → 알기 쉬운 카테고리 + 대략 월소득 ─────────────────
// 통계청 가계금융복지조사 분위 기준 단순화.
export function incomeBracket(decile: number): {
  label: string;
  short: string;
  monthlyRangeKrw: string;
} {
  if (decile <= 2) {
    return { label: "저소득층", short: "저소득", monthlyRangeKrw: "월 ~250만" };
  }
  if (decile <= 4) {
    return {
      label: "중하위 소득",
      short: "중하위",
      monthlyRangeKrw: "월 250-400만",
    };
  }
  if (decile <= 6) {
    return {
      label: "중간 소득",
      short: "중간 소득",
      monthlyRangeKrw: "월 400-550만",
    };
  }
  if (decile <= 8) {
    return {
      label: "상위 소득",
      short: "상위",
      monthlyRangeKrw: "월 550-800만",
    };
  }
  return {
    label: "최상위 소득",
    short: "최상위",
    monthlyRangeKrw: "월 800만+",
  };
}

// ── 가격 민감도 / 브랜드 충성도 0-1 → 라벨 ──────────────────────
export function sensitivityLabel(v: number): string {
  if (v >= 0.75) return "가성비 중시";
  if (v >= 0.55) return "가격 민감";
  if (v >= 0.35) return "가격 보통";
  return "가격 둔감";
}

export function loyaltyLabel(v: number): string {
  if (v >= 0.7) return "충성 높음";
  if (v >= 0.45) return "충성 보통";
  if (v >= 0.25) return "전환 쉬움";
  return "전환 적극";
}

// 월소득 KRW → 친근한 표기 ("월 420만원")
export function formatMonthlyIncome(krw: number): string {
  if (krw <= 0) return "—";
  if (krw < 10_000) return `월 ${krw.toLocaleString("ko-KR")}원`;
  const man = Math.round(krw / 10_000);
  return `월 ${man.toLocaleString("ko-KR")}만원`;
}
