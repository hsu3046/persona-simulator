"use client";

import { ArrowRightIcon, MegaphoneIcon, SparkleIcon } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { CHANNEL_META } from "@/lib/channel-meta";
import { FUNNEL_META } from "@/lib/funnel-meta";
import { formatKRW, formatSimTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";
import type { FeedEntry } from "@/types";

const LIFE_TYPE_LABEL: Record<string, string> = {
  routine: "일상",
  work: "업무",
  consumption: "소비",
  social: "사교",
  leisure: "여가",
  reflection: "생각",
};

const ACTION_LABEL: Record<string, string> = {
  ignore: "무시",
  click: "클릭",
  save: "저장",
  search: "검색",
  ask_friend: "지인 문의",
  visit_store: "매장 방문",
  purchase: "구매",
};

function getEntryId(entry: FeedEntry): string {
  return entry.kind === "life"
    ? entry.data.id
    : entry.kind === "exposure"
      ? entry.data.id
      : entry.data.id;
}

export function FeedCard({
  entry,
  product,
  highlighted = false,
}: {
  entry: FeedEntry;
  product?: Product | null;
  highlighted?: boolean;
}) {
  const entryId = getEntryId(entry);
  const highlightClass = highlighted
    ? "ring-2 ring-spark shadow-lg shadow-spark/30"
    : "";

  if (entry.kind === "life") {
    const { data } = entry;
    return (
      <Card
        data-entry-id={entryId}
        className={cn("bg-life border-border/70 transition-shadow", highlightClass)}
      >
        <CardContent className="py-3.5 px-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{formatSimTime(data.sim_timestamp)}</span>
            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
              {LIFE_TYPE_LABEL[data.type] ?? data.type}
            </Badge>
            {data.location && (
              <span className="truncate">· {data.location}</span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-life-foreground">
            {data.diary}
          </p>
          {data.spend && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>💸</span>
              <span>{data.spend.brand ?? data.spend.category}</span>
              <span>·</span>
              <span className="font-mono">{formatKRW(data.spend.amount)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (entry.kind === "exposure") {
    const { data } = entry;
    const meta = CHANNEL_META[data.channel];
    const stageBefore = FUNNEL_META[data.funnel_stage_before];
    const stageAfter = FUNNEL_META[data.funnel_stage_after];
    const changed = data.funnel_stage_before !== data.funnel_stage_after;
    const brand = product?.brand_color ?? "var(--exposure)";

    return (
      <Card
        data-entry-id={entryId}
        className={cn("relative overflow-hidden border-2 transition-shadow", highlightClass)}
        style={{
          borderColor: brand,
          background: `color-mix(in oklch, ${brand} 8%, var(--card))`,
        }}
      >
        <CardContent className="py-3.5 px-4 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono">{formatSimTime(data.sim_timestamp)}</span>
            <Badge
              className="gap-1 h-5 text-[10px] text-white"
              style={{ background: brand }}
            >
              <MegaphoneIcon weight="fill" className="size-3" />
              노출
            </Badge>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <meta.Icon weight="fill" className={cn("size-3", meta.fgClass)} />
              {meta.label}
            </span>
            <span className="text-muted-foreground">
              · {data.prior_exposure_count + 1}회차
            </span>
          </div>
          <div className="text-xs text-muted-foreground italic line-clamp-1">
            {data.context}
          </div>
          <p className="text-sm leading-relaxed">
            <span className="font-medium">&ldquo;{data.message_received}&rdquo;</span>
          </p>
          <p className="text-sm italic text-foreground/80 leading-relaxed">
            💭 {data.internal_reasoning}
          </p>
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <Badge variant="outline" className="text-[10px] h-5">
              주의도 {(data.attention_level * 100).toFixed(0)}%
            </Badge>
            {data.action_taken && (
              <Badge variant="secondary" className="text-[10px] h-5">
                반응: {ACTION_LABEL[data.action_taken] ?? data.action_taken}
              </Badge>
            )}
            {changed && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-spark/30 text-spark-foreground px-2 py-0.5 rounded-full">
                <SparkleIcon weight="fill" className="size-3" />
                <span className={stageBefore.fgClass}>{stageBefore.label}</span>
                <ArrowRightIcon weight="bold" className="size-3" />
                <span className={stageAfter.fgClass}>{stageAfter.label}</span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // funnel
  const { data } = entry;
  const before = FUNNEL_META[data.from_stage];
  const after = FUNNEL_META[data.to_stage];

  return (
    <Card
      data-entry-id={entryId}
      className={cn(
        "border-dashed border-spark/60 bg-spark/10 transition-shadow",
        highlightClass,
      )}
    >
      <CardContent className="py-2.5 px-4 flex items-center gap-2 text-xs flex-wrap">
        <SparkleIcon weight="fill" className="size-4 text-spark shrink-0" />
        <span className="font-mono">{formatSimTime(data.sim_timestamp)}</span>
        <span className="text-muted-foreground">funnel 전환:</span>
        <span className={cn("font-semibold", before.fgClass)}>{before.label}</span>
        <ArrowRightIcon weight="bold" className="size-3.5" />
        <span className={cn("font-semibold", after.fgClass)}>{after.label}</span>
        <span className="text-muted-foreground line-clamp-1 hidden sm:inline">
          — {data.reasoning}
        </span>
      </CardContent>
    </Card>
  );
}
