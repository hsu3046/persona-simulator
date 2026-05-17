"use client";

import { motion } from "motion/react";
import {
  CalendarBlankIcon,
  ChartLineUpIcon,
  PackageIcon,
  RobotIcon,
  TrashIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { cn } from "@/lib/utils";
import type { SimHistoryEntry } from "@/stores/sim-history";

function formatRunAt(iso: string): string {
  try {
    const d = new Date(iso);
    const Y = d.getFullYear();
    const M = String(d.getMonth() + 1).padStart(2, "0");
    const D = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${Y}.${M}.${D} ${h}:${m}`;
  } catch {
    return iso;
  }
}

export function HistoryCard({
  entry,
  index = 0,
  onClick,
  onRemove,
}: {
  entry: SimHistoryEntry;
  index?: number;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  const pctAdvanced =
    entry.stats.total_personas > 0
      ? (entry.stats.advanced / entry.stats.total_personas) * 100
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      whileHover={{ y: -2 }}
    >
      <Card
        className="h-full cursor-pointer transition-colors hover:border-primary/40 overflow-hidden"
        onClick={onClick}
        style={{
          borderTopColor: entry.product.brand_color ?? "var(--primary)",
          borderTopWidth: 4,
        }}
      >
        <CardContent className="p-5 space-y-3">
          <header className="flex items-start gap-3">
            <div
              className="shrink-0 size-10 rounded-lg flex items-center justify-center text-white"
              style={{
                background: entry.product.brand_color ?? "var(--primary)",
              }}
              aria-hidden
            >
              <PackageIcon weight="fill" className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {entry.product.name}
              </h3>
              <p className="text-[11px] text-muted-foreground truncate inline-flex items-center gap-1">
                <CalendarBlankIcon weight="regular" className="size-3" />
                {formatRunAt(entry.runAt)}
              </p>
            </div>
            {onRemove && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("이 히스토리를 삭제할까요?")) onRemove();
                }}
                aria-label="삭제"
              >
                <TrashIcon weight="regular" className="size-3.5" />
              </Button>
            )}
          </header>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              {entry.product.category}
            </Badge>
            {entry.source === "ai" ? (
              <Badge
                variant="outline"
                className="text-[10px] text-primary border-primary/40 gap-1"
              >
                <RobotIcon weight="fill" className="size-3" />
                AI 작성
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">
                샘플
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
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
              hint={`${pctAdvanced.toFixed(0)}%`}
            />
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground mb-1.5">
              참여 페르소나
            </p>
            <div className="flex flex-wrap gap-1">
              {entry.personas.slice(0, 5).map((p) => (
                <span
                  key={p.id}
                  className="text-[10px] bg-muted/60 px-1.5 py-0.5 rounded truncate"
                  title={`${p.age_range} · ${p.occupation}`}
                >
                  {p.name}
                </span>
              ))}
              {entry.personas.length > 5 && (
                <span className="text-[10px] text-muted-foreground">
                  +{entry.personas.length - 5}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Stat({
  Icon,
  label,
  v,
  hint,
}: {
  Icon?: React.ComponentType<{ weight?: "regular" | "fill"; className?: string }>;
  label: string;
  v: string;
  hint?: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
        {Icon && <Icon weight="regular" className="size-3" />}
        {label}
      </p>
      <p className="text-sm font-semibold tabular-nums">
        {v}
        {hint && (
          <span className={cn("text-[10px] text-muted-foreground ml-1")}>
            {hint}
          </span>
        )}
      </p>
    </div>
  );
}
