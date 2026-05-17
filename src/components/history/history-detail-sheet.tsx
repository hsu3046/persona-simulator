"use client";

import { useState } from "react";
import {
  CalendarBlankIcon,
  ChartLineUpIcon,
  PackageIcon,
  RobotIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { FeedCard } from "@/components/simulation/feed-card";
import { PersonaAvatar } from "@/components/persona/persona-avatar";

import { FUNNEL_META } from "@/lib/funnel-meta";
import { cn } from "@/lib/utils";
import type { SimHistoryEntry } from "@/stores/sim-history";

function formatRunAt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function HistoryDetailSheet({
  entry,
  open,
  onOpenChange,
}: {
  entry: SimHistoryEntry | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col gap-0 p-0"
      >
        {open && entry ? <HistoryDetailContent entry={entry} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function HistoryDetailContent({ entry }: { entry: SimHistoryEntry }) {
  const [activeId, setActiveId] = useState<string>(
    entry.personas[0]?.id ?? "",
  );

  const fakeProduct = {
    id: entry.product.id,
    name: entry.product.name,
    category: entry.product.category,
    price_krw: 0,
    positioning: "",
    unique_value_props: [],
    channels: [],
    competitor_brands: [],
    ...(entry.product.brand_color
      ? { brand_color: entry.product.brand_color }
      : {}),
  };

  return (
    <>
      <SheetHeader className="pl-6 pr-12 pt-6 pb-4 border-b">
        <SheetTitle className="flex items-center gap-2">
          <div
            className="shrink-0 size-7 rounded-md flex items-center justify-center text-white"
            style={{
              background: entry.product.brand_color ?? "var(--primary)",
            }}
          >
            <PackageIcon weight="fill" className="size-4" />
          </div>
          {entry.product.name}
        </SheetTitle>
        <SheetDescription className="flex items-center gap-1.5 text-xs">
          <CalendarBlankIcon weight="regular" className="size-3.5" />
          {formatRunAt(entry.runAt)}
          {entry.source === "ai" && (
            <Badge
              variant="outline"
              className="text-[10px] text-primary border-primary/40 gap-1 ml-1"
            >
              <RobotIcon weight="fill" className="size-3" />
              AI 작성
            </Badge>
          )}
        </SheetDescription>

        <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
          <Stat
            Icon={UsersThreeIcon}
            label="페르소나"
            v={`${entry.stats.total_personas}`}
          />
          <Stat
            Icon={ChartLineUpIcon}
            label="총 노출"
            v={`${entry.stats.total_exposures}`}
          />
          <Stat
            label="검토+"
            v={`${entry.stats.advanced} / ${entry.stats.total_personas}`}
          />
          <Stat
            label="구매"
            v={`${entry.stats.purchased} / ${entry.stats.total_personas}`}
          />
        </div>
      </SheetHeader>

      <Tabs
        value={activeId}
        onValueChange={setActiveId}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="px-6 pt-3 border-b">
          <TabsList className="flex flex-wrap h-auto bg-transparent p-0 gap-1">
            {entry.personas.map((p) => {
              const stage = entry.final_funnel[p.id] ?? "unaware";
              const meta = FUNNEL_META[stage];
              return (
                <TabsTrigger
                  key={p.id}
                  value={p.id}
                  className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  <PersonaAvatar id={p.id} name={p.name} size={20} />
                  <span>{p.name}</span>
                  <span
                    className={cn("text-[10px]", meta.fgClass)}
                    title={meta.label}
                  >
                    {meta.label}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {entry.personas.map((p) => (
          <TabsContent
            key={p.id}
            value={p.id}
            className="flex-1 min-h-0 overflow-y-auto px-6 py-4"
          >
            <div className="space-y-3 max-w-2xl mx-auto">
              {(entry.feeds[p.id] ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  이 페르소나의 시뮬레이션 기록이 없습니다.
                </p>
              ) : (
                [...(entry.feeds[p.id] ?? [])]
                  .reverse()
                  .map((e) => (
                    <FeedCard
                      key={
                        e.kind === "life"
                          ? e.data.id
                          : e.kind === "exposure"
                            ? e.data.id
                            : e.data.id
                      }
                      entry={e}
                      product={fakeProduct}
                    />
                  ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}

function Stat({
  Icon,
  label,
  v,
}: {
  Icon?: React.ComponentType<{ weight?: "regular" | "fill"; className?: string }>;
  label: string;
  v: string;
}) {
  return (
    <div className="space-y-0.5 bg-muted/40 rounded-md px-2.5 py-1.5">
      <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
        {Icon && <Icon weight="regular" className="size-3" />}
        {label}
      </p>
      <p className="text-sm font-semibold tabular-nums">{v}</p>
    </div>
  );
}
