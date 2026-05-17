"use client";

import { useEffect } from "react";

import { useAiSettingsStore } from "@/stores/ai-settings-store";

/**
 * mount 시 localStorage 에서 AI 설정 hydrate.
 * RootLayout 에 1회 mount.
 */
export function AiSettingsProvider() {
  const hydrate = useAiSettingsStore((s) => s.hydrate);
  const hydrated = useAiSettingsStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  return null;
}
