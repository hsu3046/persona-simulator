"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { ListBulletsIcon } from "@phosphor-icons/react";

import { FUNNEL_META, FUNNEL_ORDER } from "@/lib/funnel-meta";
import {
  aggregate,
  computeFunnelDistribution,
} from "@/lib/insights";
import { usePersonaStore } from "@/stores/personas";
import { useSimStore } from "@/stores/simulation";

// 우측 패널용 컴팩트 funnel 분포 표시.
// 중앙 FunnelView 와 같은 데이터지만 좁은 너비에 맞춰 horizontal stacked bar 로 단순화.

export function FunnelMini() {
  const personaIds = useSimStore((s) => s.personaIds);
  const feedByPersona = useSimStore((s) => s.feed);
  const funnelByPersona = useSimStore((s) => s.funnelByPersona);
  const allPersonas = usePersonaStore((s) => s.personas);

  const stats = useMemo(() => {
    const personas = allPersonas.filter((p) => personaIds.includes(p.id));
    const agg = aggregate(personas, feedByPersona, funnelByPersona);
    const dist = computeFunnelDistribution(agg);
    // FUNNEL_ORDER 기준으로 정렬 + 결측 채움
    return FUNNEL_ORDER.map((stage) => ({
      stage,
      count: dist.find((d) => d.stage === stage)?.count ?? 0,
    }));
  }, [allPersonas, personaIds, feedByPersona, funnelByPersona]);

  const total = personaIds.length;
  const advancedCount = stats
    .filter((s) => FUNNEL_META[s.stage].progress > 0.4)
    .reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium inline-flex items-center gap-1.5">
          <ListBulletsIcon weight="duotone" className="size-3.5" />
          Funnel 분포
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums">
            {advancedCount}
            <span className="text-base text-muted-foreground"> / {total}</span>
          </span>
          <span className="text-xs text-muted-foreground">검토 단계 이상</span>
        </div>
      </header>

      {/* 가로 stacked bar */}
      <div>
        <div className="flex h-6 rounded-md overflow-hidden border border-border">
          {stats.map((s) => {
            const widthPct = total === 0 ? 0 : (s.count / total) * 100;
            if (widthPct === 0) return null;
            return (
              <motion.div
                key={s.stage}
                initial={{ width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={{ type: "spring", stiffness: 220, damping: 30 }}
                style={{ background: FUNNEL_META[s.stage].bgVar }}
                title={`${FUNNEL_META[s.stage].label}: ${s.count}명`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
          <span>{FUNNEL_META.unaware.label}</span>
          <span>{FUNNEL_META.advocate.label}</span>
        </div>
      </div>

      {/* 상세 리스트 */}
      <ul className="space-y-1.5">
        {stats
          .filter((s) => s.count > 0)
          .map((s) => {
            const meta = FUNNEL_META[s.stage];
            const widthPct = total === 0 ? 0 : (s.count / total) * 100;
            return (
              <li key={s.stage} className="text-xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: meta.bgVar }}
                    />
                    <span className={meta.fgClass}>{meta.label}</span>
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {s.count}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full"
                    style={{ background: meta.bgVar }}
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ type: "spring", stiffness: 220, damping: 30 }}
                  />
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
