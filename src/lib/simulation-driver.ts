"use client";

import { useEffect, useMemo, useRef } from "react";

import { generateMockStream } from "@/lib/mock-stream";
import { SIM_DURATIONS } from "@/lib/sim-duration";
import { usePersonaStore } from "@/stores/personas";
import { useProductStore } from "@/stores/products";
import { useSimStore } from "@/stores/simulation";
import type { FeedEntry } from "@/types";

const TICK_INTERVAL_MS = 100;

function deltaPerTick(speed: number, realMsPerSimMin: number): number {
  return (TICK_INTERVAL_MS / realMsPerSimMin) * speed;
}

function isBefore(a: string, b: string): boolean {
  return new Date(a).getTime() <= new Date(b).getTime();
}

export function useSimulationDriver() {
  const personas = usePersonaStore((s) => s.personas);
  const products = useProductStore((s) => s.products);

  const productId = useSimStore((s) => s.productId);
  const personaIds = useSimStore((s) => s.personaIds);
  const simNow = useSimStore((s) => s.simNow);
  const status = useSimStore((s) => s.status);
  const duration = useSimStore((s) => s.duration);
  const prebuiltStreams = useSimStore((s) => s.prebuiltStreams);

  const tick = useSimStore((s) => s.tick);
  const appendEntry = useSimStore((s) => s.appendEntry);

  // 사전 생성된 stream — AI 생성 결과 우선, 없으면 mock 으로 폴백.
  const streams = useMemo(() => {
    const map: Record<string, FeedEntry[]> = {};
    const product = products.find((p) => p.id === productId);
    if (!product) return map;
    for (const pid of personaIds) {
      const ai = prebuiltStreams[pid];
      if (ai && ai.length > 0) {
        map[pid] = ai;
        continue;
      }
      const persona = personas.find((p) => p.id === pid);
      if (!persona) continue;
      map[pid] = generateMockStream(persona, product);
    }
    return map;
  }, [products, productId, personas, personaIds, prebuiltStreams]);

  const cursorsRef = useRef<Record<string, number>>({});
  const lastSimNowRef = useRef<string | null>(null);

  // 시뮬 구성 / stream 소스 변경 시 커서 리셋
  useEffect(() => {
    cursorsRef.current = Object.fromEntries(personaIds.map((id) => [id, 0]));
    lastSimNowRef.current = null;
  }, [productId, personaIds, streams]);

  useEffect(() => {
    if (status !== "playing") return;
    const meta = SIM_DURATIONS[duration];

    const interval = setInterval(() => {
      // 배속 고정 1× — 기간(24h/7d/30d) 자체가 tick 속도를 결정
      tick(deltaPerTick(1, meta.realMsPerSimMin));
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [status, duration, tick]);

  useEffect(() => {
    if (lastSimNowRef.current === simNow) return;
    lastSimNowRef.current = simNow;

    for (const pid of personaIds) {
      const arr = streams[pid];
      if (!arr) continue;
      let cursor = cursorsRef.current[pid] ?? 0;
      while (cursor < arr.length) {
        const entry = arr[cursor]!;
        const ts =
          entry.kind === "life"
            ? entry.data.sim_timestamp
            : entry.kind === "exposure"
              ? entry.data.sim_timestamp
              : entry.data.sim_timestamp;
        if (!isBefore(ts, simNow)) break;
        appendEntry(pid, entry);
        cursor++;
      }
      cursorsRef.current[pid] = cursor;
    }
  }, [simNow, personaIds, streams, appendEntry]);
}
