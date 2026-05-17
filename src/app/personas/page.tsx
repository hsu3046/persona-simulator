"use client";

import { useState } from "react";
import {
  ArrowsClockwiseIcon,
  SparkleIcon,
  TrashIcon,
  UsersThreeIcon,
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

import { PersonaCard } from "@/components/persona/persona-card";
import { PersonaCreateDialog } from "@/components/persona/persona-create-dialog";
import { PersonaDetailSheet } from "@/components/persona/persona-detail-sheet";
import { usePersonaStore } from "@/stores/personas";

export default function PersonasPage() {
  const hydrated = usePersonaStore((s) => s.hydrated);
  const personas = usePersonaStore((s) => s.personas);
  const remove = usePersonaStore((s) => s.remove);
  const duplicate = usePersonaStore((s) => s.duplicate);
  const reset = usePersonaStore((s) => s.reset);
  const resetToMock = usePersonaStore((s) => s.resetToMock);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  if (!hydrated) return <PageLoading />;

  return (
    <PageShell>
      <PageHeader
        phase="Phase 1 — 페르소나"
        title="페르소나"
        description="마케팅 목적에 맞는 가상 고객을 생성·편집합니다. 카드를 클릭해 UX 템플릿 8 섹션을 확인하세요."
        actions={
          <>
            {personas.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm("모든 페르소나를 삭제할까요?")) {
                    reset();
                    toast.success("페르소나가 모두 삭제되었습니다");
                  }
                }}
              >
                <TrashIcon weight="regular" className="size-4" />
                전체 삭제
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetToMock();
                toast.success("샘플 5명 로드", {
                  description: "박지영, 김도윤, 이수민, 정현우, 최은영",
                });
              }}
            >
              <ArrowsClockwiseIcon weight="regular" className="size-4" />
              샘플 로드
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <SparkleIcon weight="fill" className="size-4" />
              페르소나 생성
            </Button>
          </>
        }
      />

      {personas.length === 0 ? (
        <EmptyState
          Icon={UsersThreeIcon}
          title="아직 페르소나가 없습니다"
          description="마케팅 목적을 입력하면 LLM 이 UX 리서치 템플릿 8 섹션을 갖춘 페르소나를 생성합니다."
          primary={{
            label: "첫 페르소나 생성",
            onClick: () => setCreateOpen(true),
            icon: SparkleIcon,
          }}
          secondary={{
            label: "샘플 5명 로드",
            onClick: () => {
              resetToMock();
              toast.success("샘플 5명 로드");
            },
            icon: ArrowsClockwiseIcon,
          }}
        />
      ) : (
        <CardGrid>
          {personas.map((p, i) => (
            <PersonaCard
              key={p.id}
              persona={p}
              index={i}
              onClick={() => setDetailId(p.id)}
              onDuplicate={() => {
                duplicate(p.id);
                toast.success(`${p.basic.name} 복제됨`);
              }}
              onRemove={() => {
                if (confirm(`${p.basic.name} 을(를) 삭제할까요?`)) {
                  remove(p.id);
                  toast.success(`${p.basic.name} 삭제됨`);
                }
              }}
            />
          ))}
        </CardGrid>
      )}

      <PersonaCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <PersonaDetailSheet
        personaId={detailId}
        open={detailId !== null}
        onOpenChange={(o) => !o && setDetailId(null)}
      />
    </PageShell>
  );
}
