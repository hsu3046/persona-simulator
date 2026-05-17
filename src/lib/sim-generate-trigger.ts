"use client";

import { toast } from "sonner";

import { generateDayForAll } from "@/lib/sim-day-client";
import { usePersonaStore } from "@/stores/personas";
import { useProductStore } from "@/stores/products";
import { useSimStore } from "@/stores/simulation";

// 현재 진행 중인 생성 작업의 AbortController.
// "취소" 버튼이 호출하면 fetch 중단.
let currentAbort: AbortController | null = null;

export function cancelGenerate(): void {
  currentAbort?.abort(new DOMException("Cancelled by user", "AbortError"));
  currentAbort = null;
  useSimStore.getState().setGenerating(null);
}

/**
 * "AI 로 작성" 버튼 클릭 시 사용 — store 와 toast 모두 다룸.
 * 성공 시 status 가 configured 로 돌아오며 prebuilt stream 채워짐.
 * 호출 후 caller 가 자동으로 play() 하면 됨.
 */
export async function triggerGenerateAndPlay(): Promise<boolean> {
  const sim = useSimStore.getState();
  const { productId, personaIds, setGenerating, setPrebuiltStreams, play } = sim;
  const product = useProductStore
    .getState()
    .products.find((p) => p.id === productId);
  const personas = usePersonaStore
    .getState()
    .personas.filter((p) => personaIds.includes(p.id));

  if (!product || personas.length === 0) {
    toast.error("제품·서비스 또는 페르소나가 없습니다");
    return false;
  }

  setGenerating({
    items: personas.map((p) => ({
      id: p.id,
      name: p.basic.name,
      status: "pending",
    })),
    done: 0,
    running: 0,
    total: personas.length,
  });

  // 새 AbortController — 이전 진행 중 있으면 cancel
  currentAbort?.abort();
  const ctl = new AbortController();
  currentAbort = ctl;

  try {
    const result = await generateDayForAll({
      personas,
      product,
      duration: sim.duration,
      signal: ctl.signal,
      onProgress: (p) => {
        setGenerating(p);
      },
    });

    const successCount = Object.keys(result.streams).length;
    const errorCount = Object.keys(result.errors).length;

    if (successCount === 0) {
      const first =
        Object.values(result.errors)[0] ?? "모든 페르소나 생성 실패";
      toast.error("AI 작성 실패", { description: first });
      setGenerating(null);
      return false;
    }

    setPrebuiltStreams(result.streams, "ai", result.errors);

    if (errorCount > 0) {
      toast.warning(`${successCount}명 완료, ${errorCount}명 실패`, {
        description: "실패한 페르소나는 mock 으로 재생됩니다",
      });
    } else {
      toast.success(`${successCount}명의 하루 작성 완료`, {
        description: `${result.provider ?? "AI"} · 자동 재생 시작`,
      });
    }

    play();
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // 사용자 cancel 은 조용히 처리
    if (
      err instanceof DOMException &&
      err.name === "AbortError" &&
      message.includes("Cancelled by user")
    ) {
      toast.info("AI 작성을 취소했습니다");
    } else {
      toast.error("AI 작성 실패", { description: message });
    }
    setGenerating(null);
    return false;
  } finally {
    if (currentAbort === ctl) currentAbort = null;
  }
}
