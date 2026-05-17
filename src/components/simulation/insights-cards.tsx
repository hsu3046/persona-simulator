"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChatTextIcon,
  CompassIcon,
  LightbulbFilamentIcon,
  TargetIcon,
  TrendUpIcon,
} from "@phosphor-icons/react";

import { Card, CardContent } from "@/components/ui/card";

import { generateInsights } from "@/lib/insights";
import { CHANNEL_META } from "@/lib/channel-meta";
import { cn } from "@/lib/utils";
import { usePersonaStore } from "@/stores/personas";
import { useSimStore } from "@/stores/simulation";
import type { InsightCard as InsightCardType } from "@/types";

const KIND_META: Record<
  InsightCardType["kind"],
  {
    Icon: React.ComponentType<{ weight?: "fill" | "regular"; className?: string }>;
    fgClass: string;
  }
> = {
  reach: { Icon: TrendUpIcon, fgClass: "text-chart-1" },
  funnel: { Icon: TargetIcon, fgClass: "text-chart-3" },
  behavior: { Icon: CompassIcon, fgClass: "text-chart-2" },
  message: { Icon: ChatTextIcon, fgClass: "text-chart-4" },
};

export function InsightsCards() {
  const personaIds = useSimStore((s) => s.personaIds);
  const feedByPersona = useSimStore((s) => s.feed);
  const funnelByPersona = useSimStore((s) => s.funnelByPersona);
  const allPersonas = usePersonaStore((s) => s.personas);

  const insights = useMemo(() => {
    const personas = allPersonas.filter((p) => personaIds.includes(p.id));
    return generateInsights(personas, feedByPersona, funnelByPersona);
  }, [allPersonas, personaIds, feedByPersona, funnelByPersona]);

  if (insights.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium inline-flex items-center gap-1.5">
          <LightbulbFilamentIcon weight="duotone" className="size-3.5" />
          Insight
        </h3>
        <div className="border border-dashed rounded-lg p-6 text-center bg-muted/20">
          <LightbulbFilamentIcon
            weight="duotone"
            className="size-7 mx-auto text-muted-foreground mb-2"
          />
          <p className="text-xs text-muted-foreground">
            아직 인사이트가 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium inline-flex items-center gap-1.5">
        <LightbulbFilamentIcon weight="duotone" className="size-3.5" />
        Insight ({insights.length})
      </h3>
      <AnimatePresence initial={false}>
        {insights.map((card, i) => {
          const meta = KIND_META[card.kind];
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
            >
              <Card>
                <CardContent className="p-3.5 space-y-1.5">
                  <header className="flex items-start gap-2">
                    <meta.Icon
                      weight="fill"
                      className={cn("size-4 shrink-0 mt-0.5", meta.fgClass)}
                    />
                    <h4 className="font-semibold text-sm leading-snug">
                      {card.title}
                    </h4>
                  </header>
                  <p
                    className="text-xs text-muted-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: card.body }}
                  />
                  {card.related_channels && card.related_channels.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {card.related_channels.map((ch) => {
                        const cMeta = CHANNEL_META[ch];
                        return (
                          <span
                            key={ch}
                            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded"
                          >
                            <cMeta.Icon
                              weight="fill"
                              className={cn("size-3", cMeta.fgClass)}
                            />
                            {cMeta.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
