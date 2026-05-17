import type { FunnelStage } from "@/types";

export interface FunnelMeta {
  stage: FunnelStage;
  label: string;
  /** 0-1 normalized progress */
  progress: number;
  bgVar: string;
  fgClass: string;
}

export const FUNNEL_ORDER: FunnelStage[] = [
  "unaware",
  "aware",
  "interested",
  "considering",
  "intent",
  "trial",
  "purchase",
  "repeat",
  "advocate",
];

export const FUNNEL_META: Record<FunnelStage, FunnelMeta> = {
  unaware: {
    stage: "unaware",
    label: "모름",
    progress: 0,
    bgVar: "var(--funnel-unaware)",
    fgClass: "text-muted-foreground",
  },
  aware: {
    stage: "aware",
    label: "알게 됨",
    progress: 0.15,
    bgVar: "var(--funnel-aware)",
    fgClass: "text-[color:var(--funnel-aware)]",
  },
  interested: {
    stage: "interested",
    label: "관심",
    progress: 0.3,
    bgVar: "var(--funnel-aware)",
    fgClass: "text-[color:var(--funnel-aware)]",
  },
  considering: {
    stage: "considering",
    label: "고민 중",
    progress: 0.45,
    bgVar: "var(--funnel-consider)",
    fgClass: "text-[color:var(--funnel-consider)]",
  },
  intent: {
    stage: "intent",
    label: "사고 싶음",
    progress: 0.6,
    bgVar: "var(--funnel-intent)",
    fgClass: "text-[color:var(--funnel-intent)]",
  },
  trial: {
    stage: "trial",
    label: "체험",
    progress: 0.75,
    bgVar: "var(--funnel-intent)",
    fgClass: "text-[color:var(--funnel-intent)]",
  },
  purchase: {
    stage: "purchase",
    label: "구매",
    progress: 0.9,
    bgVar: "var(--funnel-purchase)",
    fgClass: "text-[color:var(--funnel-purchase)]",
  },
  repeat: {
    stage: "repeat",
    label: "재구매",
    progress: 0.95,
    bgVar: "var(--funnel-purchase)",
    fgClass: "text-[color:var(--funnel-purchase)]",
  },
  advocate: {
    stage: "advocate",
    label: "추천 중",
    progress: 1,
    bgVar: "var(--funnel-advocate)",
    fgClass: "text-[color:var(--funnel-advocate)]",
  },
  churned: {
    stage: "churned",
    label: "관심 끊음",
    progress: 0,
    bgVar: "var(--funnel-unaware)",
    fgClass: "text-destructive",
  },
};
