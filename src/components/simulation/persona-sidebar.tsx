"use client";

import { motion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { PersonaAvatar } from "@/components/persona/persona-avatar";

import { FUNNEL_META } from "@/lib/funnel-meta";
import { CDJ_LABEL, toCdjPhase } from "@/lib/marketing-engine";
import { inferMood } from "@/lib/mood";
import { cn } from "@/lib/utils";
import { usePersonaStore } from "@/stores/personas";
import { useSimStore } from "@/stores/simulation";

export function PersonaSidebar({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const personaIds = useSimStore((s) => s.personaIds);
  const funnelByPersona = useSimStore((s) => s.funnelByPersona);
  const feed = useSimStore((s) => s.feed);
  const personas = usePersonaStore((s) => s.personas);

  return (
    <aside className="w-64 shrink-0 border-r bg-card/40 overflow-y-auto">
      <div className="px-4 py-3 border-b">
        <h2 className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          페르소나 ({personaIds.length})
        </h2>
      </div>
      <div className="p-2 space-y-1">
        {personaIds.map((id) => {
          const p = personas.find((x) => x.id === id);
          if (!p) return null;
          const mood = inferMood(p.current_state.mood);
          const stage = funnelByPersona[id] ?? "unaware";
          const stageMeta = FUNNEL_META[stage];
          const cdj = toCdjPhase(stage);
          const cdjLabel = CDJ_LABEL[cdj];
          const entryCount = feed[id]?.length ?? 0;
          const active = activeId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={cn(
                "w-full text-left rounded-lg px-2.5 py-2 transition-colors flex items-center gap-2.5",
                active
                  ? "bg-primary/10 ring-1 ring-primary/40"
                  : "hover:bg-muted/60",
              )}
            >
              <div className="relative shrink-0">
                <PersonaAvatar id={p.id} name={p.basic.name} size={36} />
                <motion.span
                  key={mood.mood}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-background flex items-center justify-center text-[10px] leading-none"
                  title={mood.label}
                >
                  {mood.emoji}
                </motion.span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm truncate">
                    {p.basic.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-4 px-1.5 text-[9px] font-normal",
                      stageMeta.fgClass,
                    )}
                    style={{
                      borderColor: stageMeta.bgVar,
                    }}
                    title={`CDJ: ${cdjLabel}`}
                  >
                    {stageMeta.label}
                  </Badge>
                  <span
                    className="text-[9px] text-muted-foreground truncate"
                    title="McKinsey Consumer Decision Journey 단계"
                  >
                    {cdjLabel}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {entryCount}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
