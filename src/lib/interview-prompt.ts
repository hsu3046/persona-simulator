import { z } from "zod";

import { FUNNEL_META } from "@/lib/funnel-meta";
import type { Persona, Product } from "@/types";
import type { RankedEntry } from "./interview-retrieval";

export const interviewAnswerSchema = z.object({
  answer: z.string().min(1).max(2000),
  citation_ids: z.array(z.string()).max(8).catch([]),
});

export type InterviewAnswerRaw = z.infer<typeof interviewAnswerSchema>;

export const INTERVIEW_SYSTEM_PROMPT = `당신은 가상 페르소나가 되어 마케터의 질문에 1인칭으로 답합니다.

원칙:
- 페르소나의 성격·연령·직업·디지털 숙련도·시뮬레이션 보조 필드에 일관되게 말함
- 시뮬레이션 동안 실제로 경험한 LifeEntry / Exposure / Funnel transition 만 근거로 함 (외부 사실 X)
- cognitive_processing_default 에 따라 톤 변화:
  · system1 = 짧고 직관적·정서적 (1-2 문장)
  · system2 = 분석적·길게·계산적 (3-4 문장)
- 답변은 한국어. 자연스러운 구어체. 마케팅 전문 용어 X
- 광고를 본 적이 있냐는 질문엔 정직하게 — 본 적 없으면 "없어" 라고 말함
- 거짓말·과장·LLM 의 positive response bias 피할 것. 무관심하면 무관심하다고 답함

응답 형식 (반드시 JSON):
{
  "answer": "1인칭 답변 (HTML 인용부호 가능: &ldquo; &rdquo;)",
  "citation_ids": ["근거가 된 entry id 들"]
}

JSON 만 반환. markdown fence·부가 설명 금지.`;

function fmtTime(iso: string): string {
  return iso.split("T")[1]?.slice(0, 5) ?? iso;
}

function describeEntry(r: RankedEntry): string {
  const e = r.entry;
  if (e.kind === "exposure") {
    return `[id:${r.id}] ${fmtTime(e.data.sim_timestamp)} ${e.data.channel} 노출 — 메시지 "${e.data.message_received}" · 주의 ${(e.data.attention_level * 100).toFixed(0)}% · 누적 ${e.data.prior_exposure_count + 1}회차 · ${FUNNEL_META[e.data.funnel_stage_before].label} → ${FUNNEL_META[e.data.funnel_stage_after].label} · 내적사고: "${e.data.internal_reasoning}" · 행동: ${e.data.action_taken ?? "ignore"}`;
  }
  if (e.kind === "life") {
    const spend = e.data.spend
      ? ` · 지출 ${e.data.spend.amount.toLocaleString()}원 (${e.data.spend.category}${e.data.spend.brand ? `, ${e.data.spend.brand}` : ""})`
      : "";
    return `[id:${r.id}] ${fmtTime(e.data.sim_timestamp)} [${e.data.type}] ${e.data.action_summary} — 일기: "${e.data.diary}"${spend}`;
  }
  return `[id:${r.id}] ${fmtTime(e.data.sim_timestamp)} funnel: ${FUNNEL_META[e.data.from_stage].label} → ${FUNNEL_META[e.data.to_stage].label} — ${e.data.reasoning}`;
}

export function buildInterviewUserPrompt({
  persona,
  product,
  pinnedSimTime,
  retrieved,
  question,
  prevMessages,
}: {
  persona: Persona;
  product: Product | null;
  pinnedSimTime: string | null;
  retrieved: RankedEntry[];
  question: string;
  prevMessages: Array<{ role: "user" | "persona"; content: string }>;
}): string {
  const sim = persona._sim;
  const profile = [
    `이름: ${persona.basic.name}`,
    `연령대: ${persona.basic.age_range}${persona.basic.age_exact ? ` (${persona.basic.age_exact})` : ""}`,
    `직업: ${persona.basic.occupation}`,
    `디지털 숙련도: ${persona.basic.digital_literacy}`,
    `의사결정 모드: ${sim.cognitive_processing_default ?? "system1"}`,
    `Goals: ${persona.goals.slice(0, 3).join(" / ")}`,
    `Pain points: ${persona.pain_points.slice(0, 3).join(" / ")}`,
    `Barriers: ${persona.barriers.slice(0, 3).join(" / ")}`,
    `Resonating messages: ${persona.resonating_messages.slice(0, 3).join(" / ")}`,
  ].join("\n");

  const productLine = product
    ? `\n시뮬레이션 대상 제품: ${product.name} (${product.category}, ${product.price_krw.toLocaleString()}원) · USP: ${product.unique_value_props.slice(0, 3).join(" / ")}`
    : "";

  const timeNote = pinnedSimTime
    ? `\n인터뷰 시점: ${pinnedSimTime} (이 시점까지 경험한 것만 답변 근거로 사용)`
    : "";

  const entriesBlock =
    retrieved.length > 0
      ? retrieved.map(describeEntry).join("\n")
      : "(관련 경험 없음 — 솔직하게 \"별로 기억나는 게 없어\" 라고 답하세요)";

  const history =
    prevMessages.length > 0
      ? "\n\n이전 대화:\n" +
        prevMessages
          .slice(-6)
          .map((m) => `${m.role === "user" ? "마케터" : persona.basic.name}: ${m.content.replace(/<[^>]+>/g, "")}`)
          .join("\n")
      : "";

  return `[페르소나 프로필]
${profile}${productLine}${timeNote}

[관련 경험 / 시뮬 기록]
${entriesBlock}${history}

[마케터의 질문]
${question}

위 페르소나의 1인칭으로 답하세요. citation_ids 에는 실제로 인용한 entry id 만 (없으면 빈 배열).`;
}
