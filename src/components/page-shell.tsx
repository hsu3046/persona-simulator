"use client";

import { motion } from "motion/react";
import type { Icon } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * 모든 대시보드 페이지가 공유하는 셸.
 * - container max-w-6xl 고정 폭
 * - 좌우 px-6, 위 py-10
 * - 헤더 패턴: badge + h1 + description (+ optional action group)
 *
 * 사용:
 *   <PageShell>
 *     <PageHeader phase="Phase 1" title="페르소나" description="..." actions={<>...</>} />
 *     <YourContent />
 *   </PageShell>
 */

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("container max-w-6xl mx-auto px-6 py-10", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  phase,
  title,
  description,
  actions,
}: {
  phase?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between flex-wrap gap-4 mb-8">
      <div>
        {phase && (
          <Badge variant="secondary" className="mb-2">
            {phase}
          </Badge>
        )}
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      )}
    </header>
  );
}

export function EmptyState({
  Icon,
  title,
  description,
  primary,
  secondary,
}: {
  Icon: Icon;
  title: string;
  description?: string;
  primary?: { label: string; onClick: () => void; icon?: Icon };
  secondary?: { label: string; onClick: () => void; icon?: Icon };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-dashed rounded-xl p-12 text-center bg-muted/30"
    >
      <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary mb-4">
        <Icon weight="fill" className="size-8" />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
          {description}
        </p>
      )}
      {(primary || secondary) && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {primary && (
            <Button onClick={primary.onClick}>
              {primary.icon && (
                <primary.icon weight="bold" className="size-4" />
              )}
              {primary.label}
            </Button>
          )}
          {secondary && (
            <Button variant="outline" onClick={secondary.onClick}>
              {secondary.icon && (
                <secondary.icon weight="regular" className="size-4" />
              )}
              {secondary.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

/**
 * 카드 그리드 — 페르소나/제품 리스트 페이지 공통 패턴.
 */
export function CardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * 페이지가 hydration 대기 중일 때 동일한 placeholder.
 */
export function PageLoading() {
  return (
    <PageShell>
      <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
        로딩 중…
      </div>
    </PageShell>
  );
}
