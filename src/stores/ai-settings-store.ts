"use client";

import { create } from "zustand";

import {
  AI_SETTINGS_CHANGED_EVENT,
  type AiSettings,
  loadSettings,
  saveSettings,
  type ProviderName,
} from "@/lib/ai-settings";

interface State {
  hydrated: boolean;
  settings: AiSettings;
  setActive: (p: ProviderName) => void;
  setApiKey: (p: ProviderName, v: string) => void;
  setModel: (p: ProviderName, v: string) => void;
  hydrate: () => void;
}

const emptyConfigs = () => ({
  openrouter: { apiKey: "", model: "" },
  openai: { apiKey: "", model: "" },
  anthropic: { apiKey: "", model: "" },
  google: { apiKey: "", model: "" },
});

export const useAiSettingsStore = create<State>((set, get) => ({
  hydrated: false,
  settings: {
    activeProvider: "openrouter",
    configs: emptyConfigs(),
  },
  hydrate: () => {
    const loaded = loadSettings();
    set({
      hydrated: true,
      settings: loaded ?? {
        activeProvider: "openrouter",
        configs: emptyConfigs(),
      },
    });
    if (typeof window !== "undefined") {
      const sync = () => {
        const next = loadSettings();
        if (next) set({ settings: next });
      };
      window.addEventListener(AI_SETTINGS_CHANGED_EVENT, sync);
    }
  },
  setActive: (p) => {
    const next: AiSettings = { ...get().settings, activeProvider: p };
    set({ settings: next });
    saveSettings(next);
  },
  setApiKey: (p, v) => {
    const cur = get().settings;
    const next: AiSettings = {
      ...cur,
      configs: {
        ...cur.configs,
        [p]: { ...cur.configs[p], apiKey: v },
      },
    };
    set({ settings: next });
    saveSettings(next);
  },
  setModel: (p, v) => {
    const cur = get().settings;
    const next: AiSettings = {
      ...cur,
      configs: {
        ...cur.configs,
        [p]: { ...cur.configs[p], model: v },
      },
    };
    set({ settings: next });
    saveSettings(next);
  },
}));
