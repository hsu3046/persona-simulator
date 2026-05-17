"use client";

import { useEffect, useState } from "react";

import { InsightsPanel } from "@/components/simulation/insights-panel";
import { InterviewDrawer } from "@/components/simulation/interview-drawer";
import { LifeFeed } from "@/components/simulation/life-feed";
import { PersonaTabs } from "@/components/simulation/persona-tabs";
import { SimCompleteBanner } from "@/components/simulation/sim-complete-banner";
import { SimGeneratingOverlay } from "@/components/simulation/sim-generating-overlay";
import { SimHeader } from "@/components/simulation/sim-header";
import { SimSetup } from "@/components/simulation/sim-setup";

import { useSimHistoryAutoSave } from "@/lib/sim-history-autosave";
import { useSimulationDriver } from "@/lib/simulation-driver";
import { usePersonaStore } from "@/stores/personas";
import { useProductStore } from "@/stores/products";
import { useSimStore } from "@/stores/simulation";

export default function SimulationPage() {
  const personasHydrated = usePersonaStore((s) => s.hydrated);
  const productsHydrated = useProductStore((s) => s.hydrated);
  const status = useSimStore((s) => s.status);
  const personaIds = useSimStore((s) => s.personaIds);
  const resetForReplay = useSimStore((s) => s.resetForReplay);
  const play = useSimStore((s) => s.play);

  const [showSetup, setShowSetup] = useState(false);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(
    personaIds[0] ?? null,
  );
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  useSimulationDriver();
  useSimHistoryAutoSave();

  // 시뮬레이션 페이지에서만 body 스크롤 잠금.
  // 이유: SiteHeader 의 border-b 1px 누적으로 body 콘텐츠가 viewport 보다
  //       살짝 커져 외곽 스크롤바가 생김. 이 페이지는 내부 스크롤만 사용.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!personasHydrated || !productsHydrated) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        로딩 중…
      </div>
    );
  }

  const needsSetup = status === "idle" || showSetup;

  if (needsSetup) {
    return (
      <div className="flex-1 flex flex-col">
        <SimSetup
          onReady={() => {
            setShowSetup(false);
            setActivePersonaId(useSimStore.getState().personaIds[0] ?? null);
          }}
        />
      </div>
    );
  }

  const currentActiveId =
    activePersonaId && personaIds.includes(activePersonaId)
      ? activePersonaId
      : personaIds[0] ?? null;

  return (
    // 사이트 헤더 h-14 (3.5rem) 를 뺀 정확한 뷰포트 높이.
    // body 가 min-h-full 이라 flex-1 만으론 자식 overflow-y-auto 가 작동 안 함
    // (definite height 부재) — calc(100dvh - 헤더) 로 명시.
    <div className="flex flex-col min-h-0 h-[calc(100dvh-3.5rem)]">
      <SimHeader
        onReconfigure={() => setShowSetup(true)}
        activePersonaId={currentActiveId}
      />

      <SimCompleteBanner
        onReplay={() => {
          resetForReplay();
          play();
        }}
        onReconfigure={() => setShowSetup(true)}
      />

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <PersonaTabs
            activeId={currentActiveId}
            onSelect={setActivePersonaId}
          />
          {currentActiveId ? (
            <LifeFeed personaId={currentActiveId} />
          ) : (
            <EmptyPick />
          )}
        </div>

        <InsightsPanel
          collapsed={panelCollapsed}
          onToggle={() => setPanelCollapsed((c) => !c)}
        />
      </div>

      <InterviewDrawer />
      <SimGeneratingOverlay />
    </div>
  );
}

function EmptyPick() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 text-muted-foreground">
      <p className="text-sm">상단에서 페르소나를 선택하세요.</p>
    </div>
  );
}
