"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { FUNNEL_META } from "@/lib/funnel-meta";
import { usePersonaStore } from "@/stores/personas";
import { useProductStore } from "@/stores/products";
import {
  useSimHistoryStore,
  type SimHistoryEntry,
} from "@/stores/sim-history";
import { useSimStore } from "@/stores/simulation";

/**
 * sim status 가 "done" 으로 전환되면 현재 시뮬 상태 스냅샷을 history 에 1회 저장.
 * 같은 run 을 재방문(replay) 해도 중복 저장 안 됨 (entryIdRef 추적).
 */
export function useSimHistoryAutoSave() {
  const status = useSimStore((s) => s.status);
  const lastStatusRef = useRef<typeof status>(status);

  useEffect(() => {
    const prev = lastStatusRef.current;
    lastStatusRef.current = status;

    // configured/playing → done 전환 시만 저장 (paused → done 도 OK)
    if (status !== "done" || prev === "done") return;

    const sim = useSimStore.getState();
    const product = useProductStore
      .getState()
      .products.find((p) => p.id === sim.productId);
    if (!product) return;

    const personas = usePersonaStore
      .getState()
      .personas.filter((p) => sim.personaIds.includes(p.id));
    if (personas.length === 0) return;

    let totalExposures = 0;
    for (const id of sim.personaIds) {
      const arr = sim.feed[id] ?? [];
      for (const e of arr) if (e.kind === "exposure") totalExposures++;
    }
    const advanced = sim.personaIds.filter((id) => {
      const stage = sim.funnelByPersona[id] ?? "unaware";
      return FUNNEL_META[stage].progress >= 0.4;
    }).length;
    const purchased = sim.personaIds.filter((id) => {
      const stage = sim.funnelByPersona[id] ?? "unaware";
      return FUNNEL_META[stage].progress >= 0.85;
    }).length;

    const entry: SimHistoryEntry = {
      id: `hist-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      runAt: new Date().toISOString(),
      product: {
        id: product.id,
        name: product.name,
        category: product.category,
        ...(product.brand_color ? { brand_color: product.brand_color } : {}),
      },
      personas: personas.map((p) => ({
        id: p.id,
        name: p.basic.name,
        age_range: p.basic.age_range,
        occupation: p.basic.occupation,
      })),
      feeds: { ...sim.feed },
      final_funnel: { ...sim.funnelByPersona },
      source: sim.streamSource,
      duration_min: Math.round(
        (new Date(sim.simEnd).getTime() - new Date(sim.simStart).getTime()) /
          60_000,
      ),
      stats: {
        total_exposures: totalExposures,
        advanced,
        purchased,
        total_personas: sim.personaIds.length,
      },
    };

    useSimHistoryStore.getState().add(entry);
    toast.success("시뮬레이션 결과가 히스토리에 저장됐어요", {
      description: `${product.name} · 페르소나 ${personas.length}명`,
    });
  }, [status]);
}
