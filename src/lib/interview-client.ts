// 인터뷰 client helper — /api/sim/interview 호출 + BYOK 주입.

import { getActiveSettings } from "@/lib/ai-settings";
import type { FeedEntry, Persona, Product } from "@/types";

const CLIENT_TIMEOUT_MS = 35_000;

export interface InterviewRequest {
  persona: Persona;
  product: Product | null;
  feed: FeedEntry[];
  pinnedSimTime: string | null;
  question: string;
  prevMessages: Array<{ role: "user" | "persona"; content: string }>;
  signal?: AbortSignal;
}

export interface InterviewResult {
  answer: string;
  citations: string[];
  retrieved_ids: string[];
  provider: string;
}

export async function askInterview(
  req: InterviewRequest,
): Promise<InterviewResult> {
  const settings = getActiveSettings();
  const ctl = new AbortController();
  const timer = setTimeout(() => {
    ctl.abort(new DOMException("Client timeout (35s)", "AbortError"));
  }, CLIENT_TIMEOUT_MS);
  if (req.signal) {
    if (req.signal.aborted) ctl.abort(req.signal.reason);
    else
      req.signal.addEventListener("abort", () => ctl.abort(req.signal!.reason), {
        once: true,
      });
  }

  try {
    const res = await fetch("/api/sim/interview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: ctl.signal,
      body: JSON.stringify({
        persona: req.persona,
        product: req.product,
        feed: req.feed,
        pinnedSimTime: req.pinnedSimTime,
        question: req.question,
        prevMessages: req.prevMessages,
        settings: settings ?? undefined,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? `인터뷰 실패 (${res.status})`);
    }

    const data = (await res.json()) as InterviewResult;
    return data;
  } finally {
    clearTimeout(timer);
  }
}
