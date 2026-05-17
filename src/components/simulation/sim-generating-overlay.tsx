"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CheckCircleIcon,
  CircleNotchIcon,
  RobotIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { PersonaAvatar } from "@/components/persona/persona-avatar";
import { cancelGenerate } from "@/lib/sim-generate-trigger";
import { cn } from "@/lib/utils";
import { useSimStore } from "@/stores/simulation";
import type { PersonaGenItem } from "@/lib/sim-day-client";

export function SimGeneratingOverlay() {
  const status = useSimStore((s) => s.status);
  if (status !== "generating") return null;
  return <SimGeneratingOverlayInner />;
}

function SimGeneratingOverlayInner() {
  const progress = useSimStore((s) => s.generateProgress);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => {
      setElapsed(Math.round((performance.now() - start) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, []);

  const items = progress?.items ?? [];
  const total = progress?.total ?? 0;
  const completed = items.filter(
    (i) => i.status === "done" || i.status === "error",
  ).length;
  const pct = total === 0 ? 0 : (completed / total) * 100;
  const slow = elapsed > 45;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm"
    >
      <div className="max-w-lg w-full mx-6 space-y-5">
        <div className="text-center space-y-3">
          <div className="relative inline-flex">
            <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <RobotIcon weight="fill" className="size-7" />
            </div>
            <CircleNotchIcon
              weight="bold"
              className="size-4 text-primary absolute -bottom-1 -right-1 animate-spin bg-background rounded-full p-0.5"
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold">
              AI 가 페르소나의 하루를 작성하고 있어요
            </h2>
            <p className="text-xs text-muted-foreground tabular-nums">
              {completed} / {total} 완료 · {elapsed}초 경과
            </p>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        </div>

        {/* 페르소나별 상태 리스트 */}
        <div className="bg-card border rounded-lg divide-y">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <PersonaStatusRow key={item.id} item={item} />
            ))}
          </AnimatePresence>
        </div>

        {slow && (
          <p className="text-[11px] text-muted-foreground italic text-center">
            모델/입력에 따라 30-90초 걸릴 수 있어요. 너무 오래 걸리면 취소 후
            더 빠른 모델 (Gemini Flash, Haiku 등) 로 다시 시도해 보세요.
          </p>
        )}

        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={cancelGenerate}>
            <XCircleIcon weight="regular" className="size-4" />
            취소
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function PersonaStatusRow({ item }: { item: PersonaGenItem }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-3 py-2.5"
    >
      <PersonaAvatar id={item.id} name={item.name} size={28} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        {item.status === "done" && (
          <p className="text-[11px] text-muted-foreground">
            {item.entries ?? 0}개 entry · {item.elapsedSec?.toFixed(1)}초
          </p>
        )}
        {item.status === "error" && (
          <p className="text-[11px] text-destructive truncate">{item.error}</p>
        )}
        {item.status === "running" && (
          <p className="text-[11px] text-muted-foreground">작성 중…</p>
        )}
        {item.status === "pending" && (
          <p className="text-[11px] text-muted-foreground">대기 중</p>
        )}
      </div>
      <StatusBadge status={item.status} />
    </motion.div>
  );
}

function StatusBadge({ status }: { status: PersonaGenItem["status"] }) {
  switch (status) {
    case "done":
      return (
        <CheckCircleIcon
          weight="fill"
          className="size-5 text-primary shrink-0"
        />
      );
    case "error":
      return (
        <WarningCircleIcon
          weight="fill"
          className="size-5 text-destructive shrink-0"
        />
      );
    case "running":
      return (
        <CircleNotchIcon
          weight="bold"
          className={cn("size-5 shrink-0 animate-spin text-primary")}
        />
      );
    default:
      return (
        <div className="size-5 shrink-0 rounded-full border border-muted-foreground/30" />
      );
  }
}
