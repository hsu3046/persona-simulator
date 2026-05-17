// 시뮬레이션 기간 옵션 — 해상도·tick 속도·UI 라벨 한 곳에서 관리.

export type SimDuration = "24h" | "7d" | "30d";

export interface SimDurationMeta {
  duration: SimDuration;
  label: string;
  shortLabel: string;
  description: string;
  /** 시뮬 총 sim_minutes */
  totalMinutes: number;
  /** 1배속 = real ms / sim minute. 기간 길수록 작게 (어차피 entry 가 압축됨). */
  realMsPerSimMin: number;
  /** LLM 출력 단위 — UI / prompt 에서 사용 */
  granularity: "minute" | "hour_block" | "day";
  /** 페르소나당 평균 LLM 출력 가이드 (prompt 에 주입) */
  entryGuidance: {
    lifeMin: number;
    lifeMax: number;
    exposureMin: number;
    exposureMax: number;
  };
}

export const SIM_DURATIONS: Record<SimDuration, SimDurationMeta> = {
  "24h": {
    duration: "24h",
    label: "24시간",
    shortLabel: "24h",
    description: "하루를 분 단위로. 1인칭 일기·행동·광고노출 풍부",
    totalMinutes: 18 * 60, // 06:00 - 24:00
    realMsPerSimMin: 250, // 18 × 60 × 0.25 ≈ 270s = 4.5분 real
    granularity: "minute",
    entryGuidance: {
      lifeMin: 8,
      lifeMax: 18,
      exposureMin: 0,
      exposureMax: 8,
    },
  },
  "7d": {
    duration: "7d",
    label: "7일",
    shortLabel: "7d",
    description: "1주를 아침/점심/저녁/밤 시간대 단위로. 광고 반복 노출 효과",
    totalMinutes: 7 * 24 * 60,
    realMsPerSimMin: 30, // 7 × 24 × 60 × 0.030 ≈ 300s = 5분 real
    granularity: "hour_block",
    entryGuidance: {
      lifeMin: 10,
      lifeMax: 24,
      exposureMin: 4,
      exposureMax: 14,
    },
  },
  "30d": {
    duration: "30d",
    label: "30일",
    shortLabel: "30d",
    description: "한 달의 하이라이트 일별. 누적 frequency × funnel 진전",
    totalMinutes: 30 * 24 * 60,
    realMsPerSimMin: 7, // 30 × 24 × 60 × 0.007 ≈ 302s = 5분 real
    granularity: "day",
    entryGuidance: {
      lifeMin: 8,
      lifeMax: 20,
      exposureMin: 8,
      exposureMax: 22,
    },
  },
};

/** 시뮬 시작/종료 ISO 로컬 시각 (Date 없이 문자열로). */
export function getSimRange(
  duration: SimDuration,
  baseDate: string = "2026-05-16",
): { start: string; end: string } {
  if (duration === "24h") {
    return { start: `${baseDate}T06:00:00`, end: `${baseDate}T23:59:00` };
  }
  // 7d / 30d 는 자정 ~ 자정 N일
  const days = duration === "7d" ? 7 : 30;
  const d = new Date(`${baseDate}T00:00:00`);
  const endD = new Date(d);
  endD.setDate(endD.getDate() + days);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const fmt = (x: Date) =>
    `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(
      x.getHours(),
    )}:${pad(x.getMinutes())}:${pad(x.getSeconds())}`;
  return { start: fmt(d), end: fmt(endD) };
}
