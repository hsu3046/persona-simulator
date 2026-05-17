"use client";

import { create } from "zustand";

import type { GenerateDayProgress } from "@/lib/sim-day-client";
import { getSimRange, type SimDuration } from "@/lib/sim-duration";
import type {
  Exposure,
  FeedEntry,
  FunnelStage,
  FunnelTransition,
  LifeEntry,
  SimSpeed,
} from "@/types";

const DEFAULT_DURATION: SimDuration = "24h";

// 로컬 시간 보존 — toISOString() 은 UTC 로 변환하므로 KST 시간이 거꾸로 가는 것처럼 보임.
// "2026-05-16T06:00:00" 같은 timezone 없는 ISO 형식을 그대로 유지.
function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatLocalIso(d: Date): string {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

function addMinutes(iso: string, minutes: number): string {
  // ms 단위로 더해서 fractional minute 도 정확히 반영.
  // setMinutes(integer 만 수용) 쓰면 0.4 min 같은 fraction 이 truncate 되어 시계가 멈춤.
  const d = new Date(iso);
  d.setTime(d.getTime() + minutes * 60_000);
  return formatLocalIso(d);
}

function diffMinutes(from: string, to: string): number {
  return (new Date(to).getTime() - new Date(from).getTime()) / 60000;
}

/**
 * 사전 생성된 stream 의 출처.
 *  - "mock": 절차적 mock-stream.ts 결과
 *  - "ai":   /api/sim/generate-day 의 실제 LLM 결과
 */
export type StreamSource = "mock" | "ai";

interface SimState {
  // 설정
  productId: string | null;
  personaIds: string[];
  duration: SimDuration;

  // 실행 상태
  status:
    | "idle"
    | "configured"
    | "generating"
    | "playing"
    | "paused"
    | "done";
  speed: SimSpeed;
  simStart: string;
  simEnd: string;
  simNow: string;

  // 사전 생성된 stream (재생용) — 페르소나별
  prebuiltStreams: Record<string, FeedEntry[]>;
  streamSource: StreamSource | null;
  generateProgress: GenerateDayProgress | null;
  generateErrors: Record<string, string>;

  // 시간 진행으로 노출된 feed (시뮬레이션 driver 가 채움)
  feed: Record<string, FeedEntry[]>;
  funnelByPersona: Record<string, FunnelStage>;

  // ── 액션 ──
  configure: (
    productId: string,
    personaIds: string[],
    duration?: SimDuration,
  ) => void;
  setDuration: (d: SimDuration) => void;
  setSpeed: (s: SimSpeed) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  tick: (deltaSimMinutes: number) => void;
  appendEntry: (personaId: string, entry: FeedEntry) => void;
  resetForReplay: () => void;

  // Stream 준비 관련
  setGenerating: (progress: GenerateDayProgress | null) => void;
  setPrebuiltStreams: (
    streams: Record<string, FeedEntry[]>,
    source: StreamSource,
    errors?: Record<string, string>,
  ) => void;
}

const emptyDay = (duration: SimDuration = DEFAULT_DURATION) => {
  const range = getSimRange(duration);
  return {
    status: "idle" as const,
    speed: 4 as SimSpeed,
    duration,
    simStart: range.start,
    simEnd: range.end,
    simNow: range.start,
    feed: {} as Record<string, FeedEntry[]>,
    funnelByPersona: {} as Record<string, FunnelStage>,
    prebuiltStreams: {} as Record<string, FeedEntry[]>,
    streamSource: null as StreamSource | null,
    generateProgress: null as GenerateDayProgress | null,
    generateErrors: {} as Record<string, string>,
  };
};

export const useSimStore = create<SimState>((set, get) => ({
  productId: null,
  personaIds: [],
  ...emptyDay(),

  configure: (productId, personaIds, duration) =>
    set({
      ...emptyDay(duration ?? DEFAULT_DURATION),
      productId,
      personaIds,
      status: "configured",
      feed: Object.fromEntries(personaIds.map((id) => [id, []])),
      funnelByPersona: Object.fromEntries(
        personaIds.map((id) => [id, "unaware" as FunnelStage]),
      ),
    }),

  setDuration: (duration) =>
    set((s) => {
      // 시뮬 재생 전에만 변경 가능. configured 상태에서 stream 새로 만들어야 함.
      if (s.status !== "configured" && s.status !== "idle") return s;
      const range = getSimRange(duration);
      return {
        duration,
        simStart: range.start,
        simEnd: range.end,
        simNow: range.start,
        // duration 바뀌면 기존 stream 무효
        prebuiltStreams: {},
        streamSource: null,
      };
    }),

  setSpeed: (speed) => set({ speed }),

  play: () => {
    const { status } = get();
    if (status === "done") return;
    set({ status: "playing" });
  },

  pause: () => {
    const { status } = get();
    if (status === "playing") set({ status: "paused" });
  },

  toggle: () => {
    const { status, play, pause } = get();
    if (status === "playing") pause();
    else play();
  },

  reset: () =>
    set({
      productId: null,
      personaIds: [],
      ...emptyDay(),
    }),

  resetForReplay: () =>
    set((s) => {
      const range = getSimRange(s.duration);
      return {
        // 시간/feed 만 리셋. prebuilt stream 은 유지 (다시 재생 가능).
        simStart: range.start,
        simEnd: range.end,
        simNow: range.start,
        status: "configured",
        feed: Object.fromEntries(s.personaIds.map((id) => [id, []])),
        funnelByPersona: Object.fromEntries(
          s.personaIds.map((id) => [id, "unaware" as FunnelStage]),
        ),
      };
    }),

  setGenerating: (progress) =>
    set({
      status: progress ? "generating" : "configured",
      generateProgress: progress,
    }),

  setPrebuiltStreams: (streams, source, errors = {}) =>
    set((s) => {
      // 시뮬 시계가 첫 이벤트보다 너무 일찍 시작하면 사용자가 빈 화면을 오래 봄.
      // 가장 빠른 이벤트의 5분 전부터 시작하도록 simStart 조정.
      let earliestTs: string | null = null;
      for (const arr of Object.values(streams)) {
        for (const entry of arr) {
          const ts =
            entry.kind === "life"
              ? entry.data.sim_timestamp
              : entry.kind === "exposure"
                ? entry.data.sim_timestamp
                : entry.data.sim_timestamp;
          if (!earliestTs || ts < earliestTs) earliestTs = ts;
        }
      }
      let newSimStart = s.simStart;
      if (earliestTs) {
        const earliest = new Date(earliestTs);
        earliest.setMinutes(earliest.getMinutes() - 5);
        const adjusted = formatLocalIso(earliest);
        // 원래 simStart 보다 늦은 경우만 (이벤트가 시작점보다 미래일 때만)
        if (adjusted > s.simStart) newSimStart = adjusted;
      }
      return {
        prebuiltStreams: streams,
        streamSource: source,
        generateErrors: errors,
        generateProgress: null,
        status: "configured",
        simStart: newSimStart,
        simNow: newSimStart,
      };
    }),

  tick: (deltaSimMinutes) =>
    set((s) => {
      const nextSimNow = addMinutes(s.simNow, deltaSimMinutes);
      const past = diffMinutes(s.simEnd, nextSimNow) >= 0;
      return {
        simNow: past ? s.simEnd : nextSimNow,
        status: past ? "done" : s.status,
      };
    }),

  appendEntry: (personaId, entry) =>
    set((s) => {
      const existing = s.feed[personaId] ?? [];
      // Dedup — StrictMode double-mount 이나 streams memo 식별자 변경으로 인한
      // cursor reset → 재append 방어. id 기준 이미 들어있으면 스킵.
      if (existing.some((e) => e.data.id === entry.data.id)) return s;
      const newFunnel: Record<string, FunnelStage> = { ...s.funnelByPersona };
      if (entry.kind === "exposure") {
        newFunnel[personaId] = entry.data.funnel_stage_after;
      } else if (entry.kind === "funnel") {
        newFunnel[personaId] = entry.data.to_stage;
      }
      return {
        feed: { ...s.feed, [personaId]: [...existing, entry] },
        funnelByPersona: newFunnel,
      };
    }),
}));

// ── 도우미 셀렉터 ──
export function getProgressPct(s: Pick<SimState, "simStart" | "simEnd" | "simNow">): number {
  const total = diffMinutes(s.simStart, s.simEnd);
  const done = diffMinutes(s.simStart, s.simNow);
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (done / total) * 100));
}

export function getSimDurationMinutes(s: Pick<SimState, "simStart" | "simEnd">): number {
  return diffMinutes(s.simStart, s.simEnd);
}

// ── Types re-export for convenience ──
export type { LifeEntry, Exposure, FunnelTransition, FunnelStage };
