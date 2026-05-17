"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartBarIcon,
  TrendUpIcon,
} from "@phosphor-icons/react";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { CHANNEL_META } from "@/lib/channel-meta";
import {
  aggregate,
  computeFrequencyResponse,
  computeReachStats,
} from "@/lib/insights";
import { usePersonaStore } from "@/stores/personas";
import { useSimStore } from "@/stores/simulation";

const reachConfig = {
  exposures: { label: "노출 수", color: "var(--chart-1)" },
  funnelLifts: { label: "전환 발생", color: "var(--chart-2)" },
} satisfies ChartConfig;

const freqConfig = {
  responseRate: { label: "응답률", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function ReachChart() {
  const personaIds = useSimStore((s) => s.personaIds);
  const feedByPersona = useSimStore((s) => s.feed);
  const funnelByPersona = useSimStore((s) => s.funnelByPersona);
  const allPersonas = usePersonaStore((s) => s.personas);

  const data = useMemo(() => {
    const personas = allPersonas.filter((p) => personaIds.includes(p.id));
    const agg = aggregate(personas, feedByPersona, funnelByPersona);
    const reach = computeReachStats(agg).map((r) => ({
      channel: r.channel,
      label: CHANNEL_META[r.channel].label,
      exposures: r.exposures,
      funnelLifts: r.funnelLifts,
      attention: Math.round(r.avgAttention * 100),
    }));
    const freq = computeFrequencyResponse(agg).map((f) => ({
      x: `${f.frequency}회`,
      responseRate: Math.round(f.responseRate * 100),
      total: f.total,
      advanced: f.advanced,
    }));
    return { reach, freq };
  }, [allPersonas, personaIds, feedByPersona, funnelByPersona]);

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium inline-flex items-center gap-1.5">
          <ChartBarIcon weight="duotone" className="size-3.5" />
          채널별 Reach
        </h3>
        {data.reach.length === 0 ? (
          <Empty />
        ) : (
          <ChartContainer config={reachConfig} className="h-44 w-full">
            <BarChart data={data.reach}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                interval={0}
              />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
              <ChartTooltip
                content={<ChartTooltipContent indicator="dot" />}
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              />
              <Bar
                dataKey="exposures"
                fill="var(--color-exposures)"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="funnelLifts"
                fill="var(--color-funnelLifts)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium inline-flex items-center gap-1.5">
          <TrendUpIcon weight="duotone" className="size-3.5" />
          Frequency-Response 곡선
        </h3>
        <p className="text-[11px] text-muted-foreground">
          누적 N 번째 노출에서 funnel 전환이 일어난 비율.
        </p>
        {data.freq.length === 0 ? (
          <Empty />
        ) : (
          <ChartContainer config={freqConfig} className="h-40 w-full">
            <LineChart data={data.freq}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="x"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                unit="%"
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <Line
                type="monotone"
                dataKey="responseRate"
                stroke="var(--color-responseRate)"
                strokeWidth={2}
                dot={{ fill: "var(--color-responseRate)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </section>
    </div>
  );
}

function Empty() {
  return (
    <div className="h-24 flex items-center justify-center border border-dashed rounded-md text-xs text-muted-foreground">
      아직 노출 데이터가 없습니다
    </div>
  );
}
