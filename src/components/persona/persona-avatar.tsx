"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";

// 페르소나 아바타 stub.
// Phase 8 에서 진짜 Rive .riv 파일 + state machine 으로 교체 예정.
// id 해시로 결정적이지만 — 색·각도·그라데이션 타입 모두 분산해 5명도 충분히 달라 보임.

// 사용 가능한 색 토큰 풀 — 12 종 (chart 5 + mood 4 + funnel 3)
const COLOR_POOL = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--mood-joy)",
  "var(--mood-calm)",
  "var(--mood-tired)",
  "var(--mood-stressed)",
  "var(--funnel-aware)",
  "var(--funnel-intent)",
  "var(--funnel-advocate)",
];

const ANGLES = [45, 90, 135, 165, 200, 225, 270, 315];

interface Variant {
  stop1: number;
  stop2: number;
  angleIdx: number;
}

// 32-bit hash for stable seeding
function hash32(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function deriveVariant(id: string): Variant {
  const h = hash32(id);
  const n = COLOR_POOL.length;
  const stop1 = h % n;
  // 두 색이 항상 다르도록 offset 1..n-1
  const stop2Offset = ((h >>> 4) % (n - 1)) + 1;
  const stop2 = (stop1 + stop2Offset) % n;
  const angleIdx = (h >>> 12) % ANGLES.length;
  return { stop1, stop2, angleIdx };
}

function buildBackground(v: Variant): string {
  const c1 = COLOR_POOL[v.stop1]!;
  const c2 = COLOR_POOL[v.stop2]!;
  const angle = ANGLES[v.angleIdx]!;
  return `linear-gradient(${angle}deg, ${c1} 0%, ${c2} 100%)`;
}

export function PersonaAvatar({
  id,
  name,
  size = 56,
  className,
}: {
  id: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const background = useMemo(() => buildBackground(deriveVariant(id)), [id]);

  const initials = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return "?";
    // 한글이면 첫 글자만, 영문이면 두 단어 이니셜
    const firstChar = trimmed[0]!;
    const isHangul = /[ㄱ-ㆎ가-힣]/.test(firstChar);
    if (isHangul) return trimmed.slice(0, 1);
    const parts = trimmed.split(/\s+/);
    const a = parts[0]?.[0] ?? "?";
    const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
    return `${a}${b}`.toUpperCase();
  }, [name]);

  return (
    <div
      className={cn(
        "shrink-0 rounded-full flex items-center justify-center text-white font-bold shadow-sm",
        className,
      )}
      style={{
        width: size,
        height: size,
        background,
        fontSize: size * (initials.length > 1 ? 0.32 : 0.42),
        textShadow: "0 1px 2px rgba(0,0,0,0.25)",
      }}
      aria-label={`${name} 아바타`}
    >
      {initials}
    </div>
  );
}
