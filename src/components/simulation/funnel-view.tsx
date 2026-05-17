"use client";

import { motion } from "motion/react";

import { PersonaAvatar } from "@/components/persona/persona-avatar";
import { FUNNEL_META, FUNNEL_ORDER } from "@/lib/funnel-meta";
import { cn } from "@/lib/utils";
import { usePersonaStore } from "@/stores/personas";
import { useSimStore } from "@/stores/simulation";

const DISPLAY_STAGES = FUNNEL_ORDER; // 9 stages

export function FunnelView() {
  const personaIds = useSimStore((s) => s.personaIds);
  const funnelByPersona = useSimStore((s) => s.funnelByPersona);
  const personas = usePersonaStore((s) => s.personas);

  // 단계별 페르소나 수 집계
  const byStage: Record<string, string[]> = {};
  for (const stage of DISPLAY_STAGES) byStage[stage] = [];
  for (const pid of personaIds) {
    const stage = funnelByPersona[pid] ?? "unaware";
    if (!byStage[stage]) byStage[stage] = [];
    byStage[stage]?.push(pid);
  }

  const maxCount = Math.max(1, ...DISPLAY_STAGES.map((s) => byStage[s]?.length ?? 0));

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold">Funnel View</h2>
          <p className="text-sm text-muted-foreground">
            현재 시점 기준 페르소나가 어느 단계에 있는지 한눈에 봅니다.
          </p>
        </header>

        <div className="space-y-2">
          {DISPLAY_STAGES.map((stage) => {
            const ids = byStage[stage] ?? [];
            const meta = FUNNEL_META[stage];
            const widthPct = (ids.length / maxCount) * 100;
            return (
              <div
                key={stage}
                className="grid grid-cols-[120px_1fr_44px] items-center gap-3"
              >
                <div className="flex items-center gap-1.5 text-sm">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: meta.bgVar }}
                  />
                  <span className={cn("font-medium", meta.fgClass)}>
                    {meta.label}
                  </span>
                </div>
                <div className="relative h-10 bg-muted/50 rounded-md overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0"
                    style={{ background: meta.bgVar, opacity: 0.35 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ type: "spring", stiffness: 220, damping: 30 }}
                  />
                  <div className="absolute inset-0 flex items-center gap-1 px-2">
                    {ids.map((id) => {
                      const p = personas.find((x) => x.id === id);
                      if (!p) return null;
                      return (
                        <motion.div
                          key={id}
                          layoutId={`funnel-avatar-${id}`}
                          transition={{
                            type: "spring",
                            stiffness: 250,
                            damping: 30,
                          }}
                          title={`${p.basic.name} — ${meta.label}`}
                        >
                          <PersonaAvatar
                            id={p.id}
                            name={p.basic.name}
                            size={28}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
                <span className="text-sm font-mono text-muted-foreground text-right">
                  {ids.length}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
