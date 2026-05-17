// 페르소나 생성 — 클라이언트에서 호출.
// API key 가 BYOK 로 설정돼 있으면 그걸 동봉 (`/api/personas/generate` 가 사용 후 폐기).
// 키 없으면 server env 폴백.

import { getActiveSettings } from "@/lib/ai-settings";
import { MOCK_PERSONAS } from "@/mocks/personas";
import type { Persona } from "@/types";

export interface PersonaBrief {
  marketing_goal: string;
  target_description: string;
  count: number;
}

function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

function defaultCurrentState(): Persona["current_state"] {
  return {
    sim_timestamp: "2026-05-16T07:00:00",
    mood: { valence: 0.3, arousal: 0.5 },
    energy: 0.7,
    balance_krw: 1_000_000,
    open_intents: [],
  };
}

/**
 * 실제 LLM 으로 페르소나 생성.
 * - BYOK 설정돼 있으면 그 키/모델/provider 사용
 * - 없으면 server env 폴백
 * - 실패 시 throw — caller 가 toast 로 처리
 */
export async function generatePersonas(
  brief: PersonaBrief,
): Promise<Persona[]> {
  const settings = getActiveSettings();
  const res = await fetch("/api/personas/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      marketing_goal: brief.marketing_goal,
      target_description: brief.target_description,
      count: brief.count,
      settings: settings ?? undefined,
    }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      kind?: string;
    };
    throw new Error(data.error ?? `생성 실패 (${res.status})`);
  }

  const data = (await res.json()) as {
    personas: Array<Omit<Persona, "id" | "current_state">>;
    provider: string;
  };

  console.log("[persona-generator] API response:", {
    count: data.personas?.length,
    provider: data.provider,
    sample: data.personas?.[0],
  });

  if (!Array.isArray(data.personas) || data.personas.length === 0) {
    throw new Error(
      `API 응답에 personas 배열이 없거나 비어있습니다 (raw: ${JSON.stringify(
        data,
      ).slice(0, 200)})`,
    );
  }

  const mapped = data.personas.map((p) => ({
    ...p,
    id: `persona-gen-${cryptoId()}`,
    current_state: defaultCurrentState(),
  }));

  console.log("[persona-generator] mapped personas:", mapped.length, mapped);

  return mapped;
}

/**
 * Mock fallback — 키 없거나 빠르게 데모만 보고 싶을 때.
 * (Phase 1 의 generatePersonasMock 와 동일 동작)
 */
export async function generatePersonasMock(
  brief: PersonaBrief,
): Promise<Persona[]> {
  await new Promise((r) => setTimeout(r, 1600 + Math.random() * 1200));
  const pool = [...MOCK_PERSONAS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = pool[i];
    const b = pool[j];
    if (a && b) {
      pool[i] = b;
      pool[j] = a;
    }
  }
  const count = Math.max(1, Math.min(brief.count, pool.length));
  return pool.slice(0, count).map((p) => ({
    ...p,
    id: `persona-gen-${cryptoId()}`,
  }));
}
