"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FilmStripIcon, HourglassIcon } from "@phosphor-icons/react";

import { useInterviewStore } from "@/stores/interview";
import { useProductStore } from "@/stores/products";
import { useSimStore } from "@/stores/simulation";
import type { FeedEntry } from "@/types";

import { FeedCard } from "./feed-card";

const EMPTY_FEED: FeedEntry[] = [];

export function LifeFeed({ personaId }: { personaId: string }) {
  const feedMap = useSimStore((s) => s.feed);
  const feed = feedMap[personaId] ?? EMPTY_FEED;
  const status = useSimStore((s) => s.status);
  const productId = useSimStore((s) => s.productId);
  const product = useProductStore((s) =>
    productId ? s.products.find((p) => p.id === productId) ?? null : null,
  );
  const highlightIds = useInterviewStore((s) => s.highlightIds);
  const highlightSet = new Set(highlightIds);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastLengthRef = useRef(0);
  const lastHighlightSig = useRef("");

  // 새 카드 추가 시 컨테이너를 직접 최상단으로 스크롤.
  // 이전 topRef 방식은 reversed list 의 첫 자식 위치가 새 entry 삽입 시
  // AnimatePresence layout 애니메이션 중에 흔들려서 scrollIntoView 가 잘못 동작.
  // containerRef.scrollTo 는 위치 절대 — 신뢰성 ↑.
  useEffect(() => {
    if (feed.length > lastLengthRef.current) {
      // 다음 paint 후 호출 — AnimatePresence 가 새 카드를 DOM 에 삽입한 직후
      requestAnimationFrame(() => {
        containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
    lastLengthRef.current = feed.length;
  }, [feed.length]);

  // 인용된 카드 첫 번째를 scroll-into-view
  useEffect(() => {
    const sig = highlightIds.join(",");
    if (sig === lastHighlightSig.current) return;
    lastHighlightSig.current = sig;
    if (highlightIds.length === 0 || !containerRef.current) return;
    const firstId = highlightIds[0];
    if (!firstId) return;
    const el = containerRef.current.querySelector<HTMLElement>(
      `[data-entry-id="${CSS.escape(firstId)}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightIds]);

  if (feed.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 text-muted-foreground">
        <div className="size-14 rounded-full bg-muted/60 flex items-center justify-center mb-3">
          {status === "playing" ? (
            <HourglassIcon weight="duotone" className="size-7 animate-pulse" />
          ) : (
            <FilmStripIcon weight="regular" className="size-7" />
          )}
        </div>
        <p className="text-sm">
          {status === "idle"
            ? "시뮬레이션을 시작하려면 제품·서비스와 페르소나를 선택하세요."
            : status === "configured"
              ? "재생 버튼을 누르면 페르소나의 하루가 흐르기 시작합니다."
              : status === "playing"
                ? "곧 첫 엔트리가 도착합니다…"
                : "이 페르소나의 시뮬레이션 기록이 없습니다."}
        </p>
      </div>
    );
  }

  // 최신 카드를 상단에 표시 — feed 는 시간순(과거→현재), 화면은 현재→과거
  const reversed = [...feed].reverse();

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5"
    >
      <div className="space-y-3 max-w-3xl mx-auto">
        <AnimatePresence initial={false} mode="popLayout">
          {reversed.map((entry) => {
            const key =
              entry.kind === "life"
                ? entry.data.id
                : entry.kind === "exposure"
                  ? entry.data.id
                  : entry.data.id;
            const highlighted = highlightSet.has(key);
            return (
              <motion.div
                key={key}
                layout
                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                animate={
                  highlighted
                    ? {
                        opacity: 1,
                        y: 0,
                        scale: [1, 1.02, 1],
                      }
                    : { opacity: 1, y: 0, scale: 1 }
                }
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 28,
                  scale: highlighted
                    ? { duration: 0.8, repeat: 2, ease: "easeInOut" }
                    : undefined,
                }}
              >
                <FeedCard
                  entry={entry}
                  product={product}
                  highlighted={highlighted}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
