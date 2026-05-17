"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { FeedEntry, FunnelStage } from "@/types";
import type { StreamSource } from "@/stores/simulation";

/**
 * 시뮬레이션 완료 1회분 히스토리.
 * - 페르소나/제품 스냅샷 (외부 store 가 바뀌어도 보존)
 * - feed: 페르소나별 시뮬 entries
 * - stats: 요약 KPI
 */
export interface SimHistoryEntry {
  id: string;
  /** ISO 로컬 시각 — 실제 저장 시각 */
  runAt: string;
  product: {
    id: string;
    name: string;
    category: string;
    brand_color?: string;
  };
  personas: Array<{
    id: string;
    name: string;
    age_range: string;
    occupation: string;
  }>;
  feeds: Record<string, FeedEntry[]>;
  final_funnel: Record<string, FunnelStage>;
  source: StreamSource | null;
  /** 시뮬 기간 (분) */
  duration_min: number;
  stats: {
    total_exposures: number;
    advanced: number;
    purchased: number;
    total_personas: number;
  };
}

interface HistoryState {
  hydrated: boolean;
  setHydrated: () => void;
  entries: SimHistoryEntry[];
  add: (entry: SimHistoryEntry) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const MAX_ENTRIES = 20;

export const useSimHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      entries: [],
      add: (entry) =>
        set((s) => ({
          entries: [entry, ...s.entries].slice(0, MAX_ENTRIES),
        })),
      remove: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: "persona-simulator.history.v1",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
