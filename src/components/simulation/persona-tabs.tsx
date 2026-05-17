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

export function PersonaTabs({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const personaIds = useSimStore((s) => s.personaIds);
  const funnelByPersona = useSimStore((s) => s.funnelByPersona);
  const personas = usePersonaStore((s) => s.personas);

  return (
    <div className="border-b bg-card/40 px-4 py-2 flex items-center gap-1.5 shrink-0 w-full">
      {personaIds.map((id) => {
        const p = personas.find((x) => x.id === id);
        if (!p) return null;
        const mood = inferMood(p.current_state.mood);
        const stage = funnelByPersona[id] ?? "unaware";
        const stageMeta = FUNNEL_META[stage];
        const cdj = toCdjPhase(stage);
        const cdjLabel = CDJ_LABEL[cdj];
        const active = activeId === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={cn(
              "flex-1 min-w-0 rounded-lg px-2.5 py-1.5 transition-colors inline-flex items-center justify-center gap-2 border",
              active
                ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30"
                : "border-transparent hover:bg-muted/60",
            )}
            title={`CDJ: ${cdjLabel}`}
          >
            <PersonaAvatar id={p.id} name={p.basic.name} size={22} />
            <motion.span
              key={mood.mood}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-sm leading-none"
              title={mood.label}
            >
              {mood.emoji}
            </motion.span>
            <span className="font-medium text-sm leading-none truncate">
              {p.basic.name}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "h-4 px-1.5 text-[10px] font-normal",
                stageMeta.fgClass,
              )}
              style={{ borderColor: stageMeta.bgVar }}
            >
              {stageMeta.label}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
