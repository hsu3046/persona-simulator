"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { MOCK_PERSONAS } from "@/mocks/personas";
import type { Persona } from "@/types";

interface PersonaStore {
  personas: Persona[];
  hydrated: boolean;
  setHydrated: () => void;
  addMany: (next: Persona[]) => void;
  update: (id: string, patch: Partial<Persona>) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  reset: () => void;
  resetToMock: () => void;
}

export const usePersonaStore = create<PersonaStore>()(
  persist(
    (set) => ({
      personas: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      addMany: (next) =>
        set((s) => {
          const updated = [...s.personas, ...next];
          console.log("[personas store] addMany", {
            added: next.length,
            before: s.personas.length,
            after: updated.length,
          });
          return { personas: updated };
        }),
      update: (id, patch) =>
        set((s) => ({
          personas: s.personas.map((p) =>
            p.id === id ? ({ ...p, ...patch } as Persona) : p,
          ),
        })),
      remove: (id) =>
        set((s) => ({ personas: s.personas.filter((p) => p.id !== id) })),
      duplicate: (id) =>
        set((s) => {
          const found = s.personas.find((p) => p.id === id);
          if (!found) return s;
          const clone: Persona = {
            ...found,
            id: `${found.id}-copy-${Date.now().toString(36)}`,
            basic: { ...found.basic, name: `${found.basic.name} (복제)` },
          };
          return { personas: [...s.personas, clone] };
        }),
      reset: () => set({ personas: [] }),
      resetToMock: () => set({ personas: MOCK_PERSONAS }),
    }),
    {
      name: "persona-simulator.personas.v1",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
