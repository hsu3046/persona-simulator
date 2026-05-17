"use client";

import { useState } from "react";
import {
  ClockCounterClockwiseIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  CardGrid,
  EmptyState,
  PageHeader,
  PageLoading,
  PageShell,
} from "@/components/page-shell";

import { HistoryCard } from "@/components/history/history-card";
import { HistoryDetailSheet } from "@/components/history/history-detail-sheet";
import { useSimHistoryStore } from "@/stores/sim-history";

export default function HistoryPage() {
  const hydrated = useSimHistoryStore((s) => s.hydrated);
  const entries = useSimHistoryStore((s) => s.entries);
  const remove = useSimHistoryStore((s) => s.remove);
  const clear = useSimHistoryStore((s) => s.clear);

  const [detailId, setDetailId] = useState<string | null>(null);

  if (!hydrated) return <PageLoading />;

  const detail = detailId
    ? entries.find((e) => e.id === detailId) ?? null
    : null;

  return (
    <PageShell>
      <PageHeader
        phase="히스토리"
        title="시뮬레이션 기록"
        description="완료된 시뮬레이션의 페르소나별 라이프 로그와 funnel 결과를 다시 살펴봅니다. 최근 20회까지 자동 저장됩니다."
        actions={
          entries.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("모든 히스토리를 삭제할까요?")) {
                  clear();
                  toast.success("히스토리가 모두 삭제되었습니다");
                }
              }}
            >
              <TrashIcon weight="regular" className="size-4" />
              전체 삭제
            </Button>
          ) : null
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          Icon={ClockCounterClockwiseIcon}
          title="아직 저장된 히스토리가 없습니다"
          description="시뮬레이션을 완료하면 자동으로 결과가 여기에 저장됩니다."
        />
      ) : (
        <CardGrid>
          {entries.map((e, i) => (
            <HistoryCard
              key={e.id}
              entry={e}
              index={i}
              onClick={() => setDetailId(e.id)}
              onRemove={() => {
                remove(e.id);
                toast.success("히스토리에서 제거됨");
              }}
            />
          ))}
        </CardGrid>
      )}

      <HistoryDetailSheet
        entry={detail}
        open={detailId !== null}
        onOpenChange={(o) => !o && setDetailId(null)}
      />
    </PageShell>
  );
}
