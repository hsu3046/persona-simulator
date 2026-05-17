import type { Emotion } from "@/types";

// Emotion valence/arousal → 무드 메타.
// 페르소나 카드/Exposure 카드에서 공통 사용. emoji 가 1차 시각 신호,
// 색 배지 (bg/fg) 가 보조. 상태별로 emoji 자체가 다르므로 색맹/저시력 환경에서도 식별 가능.

export type Mood = "joy" | "calm" | "tired" | "stressed";

// 후속 단계에서 Rive state machine input 으로도 사용 가능한 일반 weight 열거.
export type PhosphorWeight =
  | "thin"
  | "light"
  | "regular"
  | "bold"
  | "fill"
  | "duotone";

export interface MoodMeta {
  mood: Mood;
  label: string;
  emoji: string;
  weight: PhosphorWeight;
  bgClass: string;
  fgClass: string;
}

export function inferMood(emotion: Emotion): MoodMeta {
  const { valence, arousal } = emotion;

  if (valence > 0.4 && arousal > 0.45) {
    return {
      mood: "joy",
      label: "행복",
      emoji: "😊",
      weight: "fill",
      bgClass: "bg-[color:var(--mood-joy)]/20",
      fgClass: "text-[color:var(--mood-joy)]",
    };
  }
  if (valence > 0 && arousal <= 0.45) {
    return {
      mood: "calm",
      label: "평온",
      emoji: "😌",
      weight: "regular",
      bgClass: "bg-[color:var(--mood-calm)]/20",
      fgClass: "text-[color:var(--mood-calm)]",
    };
  }
  if (valence <= 0 && arousal <= 0.5) {
    return {
      mood: "tired",
      label: "피곤",
      emoji: "😴",
      weight: "thin",
      bgClass: "bg-[color:var(--mood-tired)]/20",
      fgClass: "text-[color:var(--mood-tired)]",
    };
  }
  return {
    mood: "stressed",
    label: "스트레스",
    emoji: "😣",
    weight: "bold",
    bgClass: "bg-[color:var(--mood-stressed)]/20",
    fgClass: "text-[color:var(--mood-stressed)]",
  };
}
