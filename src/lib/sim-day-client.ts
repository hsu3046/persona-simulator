// 시뮬 day stream 생성 — 클라이언트 helper.
// 페르소나 N명 병렬 호출 + 진행률 콜백.

import { getActiveSettings } from "@/lib/ai-settings";
import type { SimDuration } from "@/lib/sim-duration";
import type { FeedEntry, Persona, Product } from "@/types";

export type PersonaGenStatus = "pending" | "running" | "done" | "error";

export interface PersonaGenItem {
  id: string;
  name: string;
  status: PersonaGenStatus;
  /** done 일 때 stream entry 수 */
  entries?: number;
  /** done 일 때 소요 시간 (초) */
  elapsedSec?: number;
  /** error 일 때 메시지 */
  error?: string;
}

export interface GenerateDayProgress {
  items: PersonaGenItem[];
  done: number;
  running: number;
  total: number;
}

export interface GenerateDayResult {
  streams: Record<string, FeedEntry[]>;
  errors: Record<string, string>;
  provider: string | null;
}

// 클라이언트 측 안전망 — 서버 90s 보다 살짝 길게.
const CLIENT_TIMEOUT_MS = 100_000;

async function generateForOne({
  persona,
  product,
  duration,
  signal,
}: {
  persona: Persona;
  product: Product;
  duration: SimDuration;
  signal?: AbortSignal;
}): Promise<{ stream: FeedEntry[]; provider: string }> {
  const settings = getActiveSettings();
  const ctl = new AbortController();
  const timer = setTimeout(() => {
    ctl.abort(
      new DOMException("Client timeout (100s)", "AbortError"),
    );
  }, CLIENT_TIMEOUT_MS);
  if (signal) {
    if (signal.aborted) ctl.abort(signal.reason);
    else
      signal.addEventListener("abort", () => ctl.abort(signal.reason), {
        once: true,
      });
  }

  const t0 = performance.now();
  console.log(`[sim-day-client] → ${persona.basic.name} 요청 시작`);

  try {
    const res = await fetch("/api/sim/generate-day", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: ctl.signal,
      body: JSON.stringify({
        persona,
        product,
        duration,
        settings: settings ?? undefined,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        kind?: string;
      };
      console.warn(
        `[sim-day-client] ✗ ${persona.basic.name} ${res.status} (${((performance.now() - t0) / 1000).toFixed(1)}s)`,
        data,
      );
      throw new Error(data.error ?? `생성 실패 (${res.status})`);
    }

    const data = (await res.json()) as {
      stream: FeedEntry[];
      meta: { provider: string };
    };
    console.log(
      `[sim-day-client] ✓ ${persona.basic.name} (${((performance.now() - t0) / 1000).toFixed(1)}s, ${data.stream.length} entries)`,
    );
    return { stream: data.stream, provider: data.meta.provider };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * N명의 페르소나에 대해 24h stream 을 LLM 으로 병렬 생성.
 * 한 명 실패해도 나머지는 계속 (errors map 에 기록).
 */
export async function generateDayForAll({
  personas,
  product,
  duration,
  signal,
  onProgress,
}: {
  personas: Persona[];
  product: Product;
  duration: SimDuration;
  signal?: AbortSignal;
  onProgress?: (progress: GenerateDayProgress) => void;
}): Promise<GenerateDayResult> {
  let provider: string | null = null;

  const streams: Record<string, FeedEntry[]> = {};
  const errors: Record<string, string> = {};

  // 페르소나별 상태 추적 (참조 mutation + emit)
  const items: PersonaGenItem[] = personas.map((p) => ({
    id: p.id,
    name: p.basic.name,
    status: "pending",
  }));

  const emit = () => {
    const done = items.filter((i) => i.status === "done").length;
    const errored = items.filter((i) => i.status === "error").length;
    const running = items.filter((i) => i.status === "running").length;
    onProgress?.({
      items: items.map((i) => ({ ...i })),
      done: done + errored, // overlay 의 "완료" 카운트엔 실패도 포함
      running,
      total: items.length,
    });
  };

  emit();

  await Promise.all(
    personas.map(async (persona, idx) => {
      const item = items[idx]!;
      item.status = "running";
      const t0 = performance.now();
      emit();
      try {
        const { stream, provider: p } = await generateForOne({
          persona,
          product,
          duration,
          signal,
        });
        streams[persona.id] = stream;
        if (!provider) provider = p;
        item.status = "done";
        item.entries = stream.length;
        item.elapsedSec = Math.round((performance.now() - t0) / 100) / 10;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors[persona.id] = msg;
        item.status = "error";
        item.error = msg;
        item.elapsedSec = Math.round((performance.now() - t0) / 100) / 10;
      } finally {
        emit();
      }
    }),
  );

  return { streams, errors, provider };
}
