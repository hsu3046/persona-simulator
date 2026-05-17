"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import {
  ArrowCounterClockwiseIcon,
  GearSixIcon,
  SparkleIcon,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

import { FUNNEL_META } from "@/lib/funnel-meta";
import {
  aggregate,
  computeReachStats,
} from "@/lib/insights";
import { usePersonaStore } from "@/stores/personas";
import { useSimStore } from "@/stores/simulation";

export function SimCompleteBanner({
  onReplay,
  onReconfigure,
}: {
  onReplay: () => void;
  onReconfigure: () => void;
}) {
  const status = useSimStore((s) => s.status);
  const personaIds = useSimStore((s) => s.personaIds);
  const feedByPersona = useSimStore((s) => s.feed);
  const funnelByPersona = useSimStore((s) => s.funnelByPersona);
  const allPersonas = usePersonaStore((s) => s.personas);

  const summary = useMemo(() => {
    const personas = allPersonas.filter((p) => personaIds.includes(p.id));
    const agg = aggregate(personas, feedByPersona, funnelByPersona);
    const reach = computeReachStats(agg);
    const totalExposures = reach.reduce((s, r) => s + r.exposures, 0);
    const advanced = personas.filter((p) => {
      const stage = funnelByPersona[p.id] ?? "unaware";
      return FUNNEL_META[stage].progress >= 0.4;
    }).length;
    const purchased = personas.filter((p) => {
      const stage = funnelByPersona[p.id] ?? "unaware";
      return FUNNEL_META[stage].progress >= 0.85;
    }).length;
    return {
      totalExposures,
      advanced,
      purchased,
      total: personas.length,
    };
  }, [allPersonas, personaIds, feedByPersona, funnelByPersona]);

  if (status !== "done") return null;

  return (
    <motion.div
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="border-b bg-spark/15"
    >
      <div className="px-6 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <SparkleIcon weight="fill" className="size-5 text-spark" />
          <span className="font-semibold text-sm">시뮬레이션 완료</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Stat label="총 노출" value={summary.totalExposures} />
          <Stat
            label="검토 이상 진입"
            value={`${summary.advanced} / ${summary.total}`}
          />
          <Stat
            label="구매 단계"
            value={`${summary.purchased} / ${summary.total}`}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onReconfigure}>
            <GearSixIcon weight="regular" className="size-4" />
            재구성
          </Button>
          <Button size="sm" onClick={onReplay}>
            <ArrowCounterClockwiseIcon weight="bold" className="size-4" />
            다시 재생
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
