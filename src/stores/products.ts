"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { MOCK_PRODUCT } from "@/mocks/product";
import type { Product } from "@/types";

interface ProductStore {
  products: Product[];
  hydrated: boolean;
  setHydrated: () => void;
  add: (p: Product) => void;
  update: (id: string, patch: Partial<Product>) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  reset: () => void;
  resetToMock: () => void;
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set) => ({
      products: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      add: (p) => set((s) => ({ products: [...s.products, p] })),
      update: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? ({ ...p, ...patch } as Product) : p,
          ),
        })),
      remove: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
      duplicate: (id) =>
        set((s) => {
          const found = s.products.find((p) => p.id === id);
          if (!found) return s;
          const clone: Product = {
            ...found,
            id: `${found.id}-copy-${Date.now().toString(36)}`,
            name: `${found.name} (복제)`,
          };
          return { products: [...s.products, clone] };
        }),
      reset: () => set({ products: [] }),
      resetToMock: () => set({ products: [MOCK_PRODUCT] }),
    }),
    {
      name: "persona-simulator.products.v1",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
