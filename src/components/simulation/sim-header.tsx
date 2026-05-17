"use client";

import {
  ArrowCounterClockwiseIcon,
  ChatCircleDotsIcon,
  GearSixIcon,
  PackageIcon,
  PauseIcon,
  PlayIcon,
} from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSimDateTime } from "@/lib/format";
import { SIM_DURATIONS } from "@/lib/sim-duration";
import { triggerGenerateAndPlay } from "@/lib/sim-generate-trigger";
import { useInterviewStore } from "@/stores/interview";
import { useProductStore } from "@/stores/products";
import { getProgressPct, useSimStore } from "@/stores/simulation";

export function SimHeader({
  onReconfigure,
  activePersonaId,
}: {
  onReconfigure: () => void;
  activePersonaId: string | null;
}) {
  const productId = useSimStore((s) => s.productId);
  const status = useSimStore((s) => s.status);
  const simStart = useSimStore((s) => s.simStart);
  const simEnd = useSimStore((s) => s.simEnd);
  const simNow = useSimStore((s) => s.simNow);
  const pause = useSimStore((s) => s.pause);
  const play = useSimStore((s) => s.play);

  const resetForReplay = useSimStore((s) => s.resetForReplay);

  const streamSource = useSimStore((s) => s.streamSource);
  const duration = useSimStore((s) => s.duration);
  const openInterview = useInterviewStore((s) => s.openFor);
  const interviewOpen = useInterviewStore((s) => s.open);

  const product = useProductStore((s) =>
    productId ? s.products.find((p) => p.id === productId) ?? null : null,
  );

  const progress = getProgressPct({ simStart, simEnd, simNow });

  return (
    <div className="border-b bg-card/60 backdrop-blur-md">
      <div className="px-6 py-3 flex items-center gap-4">
        {/* 제품 chip */}
        {product ? (
          <button
            type="button"
            onClick={onReconfigure}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm"
          >
            <span
              className="size-6 rounded-md flex items-center justify-center text-white shrink-0"
              style={{ background: product.brand_color ?? "var(--primary)" }}
              aria-hidden
            >
              <PackageIcon weight="fill" className="size-3.5" />
            </span>
            <span className="font-medium truncate max-w-[160px]">
              {product.name}
            </span>
            <GearSixIcon
              weight="regular"
              className="size-3.5 text-muted-foreground"
            />
          </button>
        ) : null}

        {/* 시간 진행바 */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="inline-flex items-center gap-2 min-w-0">
              <span className="font-mono truncate">
                {formatSimDateTime(simNow)}
              </span>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {SIM_DURATIONS[duration].label}
              </Badge>
            </span>
            <span className="text-muted-foreground tabular-nums shrink-0">
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded-full transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 인터뷰 — 재생 중이거나 일시정지일 때만 */}
        {activePersonaId &&
          (status === "playing" ||
            status === "paused" ||
            status === "done") && (
            <Button
              variant={interviewOpen ? "secondary" : "outline"}
              size="default"
              onClick={() => {
                pause();
                openInterview(activePersonaId, simNow);
              }}
            >
              <ChatCircleDotsIcon weight="fill" className="size-4" />
              인터뷰
            </Button>
          )}

        {/* 재생 컨트롤 — 상태별로 명확히 다른 버튼 */}
        {status === "configured" && streamSource !== "ai" && (
          <Button
            onClick={() => {
              void triggerGenerateAndPlay();
            }}
          >
            <PlayIcon weight="fill" className="size-4" />
            시뮬레이션 시작
          </Button>
        )}

        {status === "configured" && streamSource === "ai" && (
          <Button onClick={play}>
            <PlayIcon weight="fill" className="size-4" />
            재생
          </Button>
        )}

        {status === "playing" && (
          <Button onClick={pause}>
            <PauseIcon weight="fill" className="size-4" />
            일시정지
          </Button>
        )}

        {status === "paused" && (
          <Button onClick={play}>
            <PlayIcon weight="fill" className="size-4" />
            재생
          </Button>
        )}

        {status === "done" && (
          <Button
            onClick={() => {
              resetForReplay();
              play();
            }}
          >
            <ArrowCounterClockwiseIcon weight="bold" className="size-4" />
            다시 재생
          </Button>
        )}

        {/* status badge */}
        {status === "done" && (
          <Badge variant="secondary" className="text-[10px]">
            완료
          </Badge>
        )}
      </div>
    </div>
  );
}
