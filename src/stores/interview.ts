"use client";

import { create } from "zustand";

export interface InterviewMessage {
  id: string;
  role: "user" | "persona";
  content: string;
  /** Persona 답변 시 인용한 LifeEntry / Exposure / FunnelTransition ID. */
  citations?: string[];
  sim_timestamp: string;
}

interface InterviewState {
  open: boolean;
  personaId: string | null;
  /** 인터뷰 시점 (sim_timestamp 스냅샷). 일시정지된 그 순간. */
  pinnedSimTime: string | null;
  messages: InterviewMessage[];
  loading: boolean;
  /** 가장 최근 답변의 인용 IDs — 피드에서 깜빡일 대상. */
  highlightIds: string[];

  openFor: (personaId: string, simTime: string) => void;
  close: () => void;
  setPersona: (personaId: string) => void;
  appendUser: (content: string) => void;
  appendPersona: (content: string, citations: string[]) => void;
  setLoading: (loading: boolean) => void;
  clearHighlight: () => void;
  resetConversation: () => void;
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

export const useInterviewStore = create<InterviewState>((set) => ({
  open: false,
  personaId: null,
  pinnedSimTime: null,
  messages: [],
  loading: false,
  highlightIds: [],

  openFor: (personaId, simTime) =>
    set((s) => ({
      open: true,
      personaId,
      pinnedSimTime: simTime,
      messages:
        s.personaId === personaId ? s.messages : [],
      highlightIds: [],
    })),

  close: () => set({ open: false, highlightIds: [] }),

  setPersona: (personaId) =>
    set((s) => ({
      personaId,
      messages: s.personaId === personaId ? s.messages : [],
      highlightIds: [],
    })),

  appendUser: (content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: newId(),
          role: "user",
          content,
          sim_timestamp: s.pinnedSimTime ?? "",
        },
      ],
    })),

  appendPersona: (content, citations) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: newId(),
          role: "persona",
          content,
          citations,
          sim_timestamp: s.pinnedSimTime ?? "",
        },
      ],
      highlightIds: citations,
    })),

  setLoading: (loading) => set({ loading }),

  clearHighlight: () => set({ highlightIds: [] }),

  resetConversation: () => set({ messages: [], highlightIds: [] }),
}));
