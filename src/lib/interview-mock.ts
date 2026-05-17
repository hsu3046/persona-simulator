// Mock interview engine.
// Phase 10 에서 실제 pgvector retrieval + Vercel AI SDK streamText 로 교체.
// 현재: pinnedSimTime 까지의 feed 에서 키워드+휴리스틱으로 retrieval 후
//       페르소나 톤으로 1인칭 답변 합성.

import { FUNNEL_META } from "@/lib/funnel-meta";
import type { FeedEntry, Persona, Product } from "@/types";

export interface InterviewContext {
  persona: Persona;
  product: Product | null;
  /** pinnedSimTime 까지의 feed entries only. */
  feed: FeedEntry[];
  question: string;
  prevMessages: Array<{ role: "user" | "persona"; content: string }>;
}

interface RankedEntry {
  entry: FeedEntry;
  score: number;
  id: string;
  ts: string;
}

const KW_AD = ["광고", "노출", "본", "봤어", "본적", "스폰서", "캠페인"];
const KW_BUY = ["사", "구매", "왜", "안", "안 샀", "가입", "결제", "선택"];
const KW_FRIEND = ["친구", "동료", "추천", "지인", "주변"];
const KW_MOOD = ["기분", "느낌", "어땠", "어떤 마음", "감정"];

function getEntryId(e: FeedEntry): string {
  return e.kind === "life"
    ? e.data.id
    : e.kind === "exposure"
      ? e.data.id
      : e.data.id;
}

function getEntryTs(e: FeedEntry): string {
  return e.kind === "life"
    ? e.data.sim_timestamp
    : e.kind === "exposure"
      ? e.data.sim_timestamp
      : e.data.sim_timestamp;
}

function fmtTime(iso: string): string {
  return iso.split("T")[1]?.slice(0, 5) ?? iso;
}

function score(entry: FeedEntry, question: string): number {
  const q = question.toLowerCase();
  let s = 0;
  const askAd = KW_AD.some((k) => q.includes(k));
  const askBuy = KW_BUY.some((k) => q.includes(k));
  const askFriend = KW_FRIEND.some((k) => q.includes(k));
  const askMood = KW_MOOD.some((k) => q.includes(k));

  if (entry.kind === "exposure") {
    s += 3;
    if (askAd) s += 5;
    if (askBuy && entry.data.action_taken && entry.data.action_taken !== "ignore") s += 3;
    if (askFriend && entry.data.channel === "word_of_mouth") s += 6;
    if (entry.data.attention_level > 0.5) s += 1;
    if (entry.data.funnel_stage_before !== entry.data.funnel_stage_after) s += 2;
  } else if (entry.kind === "life") {
    s += 1;
    if (askMood) s += 3;
    if (entry.data.type === "consumption" && askBuy) s += 2;
    if (entry.data.type === "reflection") s += 2;
    // 키워드 본문 매칭
    const text = (entry.data.diary + entry.data.action_summary).toLowerCase();
    for (const k of [...KW_AD, ...KW_BUY, ...KW_FRIEND]) {
      if (text.includes(k.toLowerCase())) s += 1;
    }
  } else {
    // funnel transition
    s += 2;
    if (askBuy) s += 3;
  }
  return s;
}

function recencyBoost(entry: FeedEntry, allEntries: FeedEntry[]): number {
  // 최근 엔트리에 가산 (인터뷰 시점 가까운 것)
  const idx = allEntries.findIndex((e) => getEntryId(e) === getEntryId(entry));
  if (idx < 0) return 0;
  // 끝에 가까울수록 큰 점수
  return (idx / Math.max(1, allEntries.length - 1)) * 2;
}

function retrieve(ctx: InterviewContext, max = 4): RankedEntry[] {
  const ranked: RankedEntry[] = ctx.feed.map((entry) => ({
    entry,
    id: getEntryId(entry),
    ts: getEntryTs(entry),
    score: score(entry, ctx.question) + recencyBoost(entry, ctx.feed),
  }));
  ranked.sort((a, b) => b.score - a.score);
  return ranked.filter((r) => r.score >= 2).slice(0, max);
}

function tonePrefix(persona: Persona): string {
  // 디지털 숙련도와 직업으로 살짝 톤 조정
  if (persona.basic.digital_literacy === "expert") return "";
  if (persona.basic.occupation.includes("교사")) return "";
  return "";
}

function describeExposure(e: FeedEntry & { kind: "exposure" }): string {
  const channel = e.data.channel;
  const t = fmtTime(e.data.sim_timestamp);
  return `${t} 즈음 ${channel} 에서 본 광고 — &ldquo;${e.data.message_received}&rdquo;. ${e.data.internal_reasoning}`;
}

function describeLife(e: FeedEntry & { kind: "life" }): string {
  return `${fmtTime(e.data.sim_timestamp)} ${e.data.action_summary}: ${e.data.diary}`;
}

function describeFunnel(e: FeedEntry & { kind: "funnel" }): string {
  const before = FUNNEL_META[e.data.from_stage].label;
  const after = FUNNEL_META[e.data.to_stage].label;
  return `${fmtTime(e.data.sim_timestamp)} ${before} → ${after} 단계로 옮겨감 (${e.data.reasoning}).`;
}

function composeAnswer(
  ctx: InterviewContext,
  retrieved: RankedEntry[],
): string {
  const persona = ctx.persona;
  const q = ctx.question.toLowerCase();
  const askAd = KW_AD.some((k) => q.includes(k));
  const askBuy = KW_BUY.some((k) => q.includes(k));
  const askMood = KW_MOOD.some((k) => q.includes(k));
  const tone = tonePrefix(persona);

  if (retrieved.length === 0) {
    return `${tone}음... 아직 그 부분에 대해선 별로 인상 깊은 게 없었어. 오늘 하루 동안은 그냥 평범했던 것 같아.`;
  }

  const exposures = retrieved.filter((r) => r.entry.kind === "exposure");
  const lifeEntries = retrieved.filter((r) => r.entry.kind === "life");
  const funnels = retrieved.filter((r) => r.entry.kind === "funnel");

  // 광고 본 적 있냐 류
  if (askAd && exposures.length > 0) {
    const counts = exposures.length;
    const top = exposures[0]?.entry;
    if (top?.kind === "exposure") {
      const prior = top.data.prior_exposure_count + 1;
      const channels = [
        ...new Set(
          exposures.map((r) => (r.entry.kind === "exposure" ? r.entry.data.channel : "")),
        ),
      ].filter(Boolean);
      const channelText = channels.slice(0, 3).join(", ");
      return `${tone}응, 봤어. 솔직히 오늘만 ${counts}번 정도? ${channelText} 같은 곳에서. 특히 ${fmtTime(top.data.sim_timestamp)} 즈음에 ${top.data.channel} 에서 본 게 가장 인상 깊었는데, &ldquo;${top.data.message_received}&rdquo; 라는 카피였어. ${top.data.internal_reasoning}${prior >= 3 ? ` 솔직히 같은 메시지를 ${prior}번 보니 좀 신경 쓰이긴 해.` : ""}`;
    }
  }

  // 왜 안 샀어 / 샀어 류
  if (askBuy) {
    if (funnels.length > 0 && funnels[0]?.entry.kind === "funnel") {
      const f = funnels[0].entry;
      const after = FUNNEL_META[f.data.to_stage].label;
      const ex = exposures[0]?.entry;
      const exposureMention =
        ex?.kind === "exposure"
          ? ` 결정적이었던 건 ${fmtTime(ex.data.sim_timestamp)} ${ex.data.channel} 에서 본 거였어. &ldquo;${ex.data.message_received}&rdquo;.`
          : "";
      return `${tone}지금은 &ldquo;${after}&rdquo; 단계 정도? 완전히 결정한 건 아닌데 마음이 어느 정도 기울었어.${exposureMention} 아직 ${persona.barriers.slice(0, 1).join(", ")} 같은 부분이 걸려서 한 번 더 생각하고 있어.`;
    }
    return `${tone}아직 결정 못 했어. ${persona.barriers.slice(0, 2).join(", ")} 같은 게 마음에 걸려. 그래도 ${persona.resonating_messages[0] ? `&ldquo;${persona.resonating_messages[0]}&rdquo;` : "이 메시지"} 부분은 마음에 들어.`;
  }

  // 기분/감정 류
  if (askMood) {
    const lifeRef = lifeEntries[0]?.entry;
    if (lifeRef?.kind === "life") {
      const v = lifeRef.data.emotion.valence;
      const moodWord = v > 0.3 ? "꽤 괜찮아" : v > 0 ? "그럭저럭" : v > -0.2 ? "좀 무거워" : "별로야";
      return `${tone}지금 기분? ${moodWord}. ${lifeRef.data.diary}`;
    }
  }

  // 일반 — 가장 점수 높은 retrieved 를 요약
  const parts = retrieved.slice(0, 3).map((r) => {
    if (r.entry.kind === "exposure") return describeExposure(r.entry);
    if (r.entry.kind === "life") return describeLife(r.entry);
    return describeFunnel(r.entry);
  });
  return `${tone}몇 가지 떠올라. ${parts.join(" 그리고 ")}.`;
}

export interface MockInterviewResult {
  answer: string;
  citations: string[];
}

export async function answerInterviewMock(
  ctx: InterviewContext,
): Promise<MockInterviewResult> {
  // 짧은 think 딜레이로 자연스러움
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 700));

  const retrieved = retrieve(ctx);
  const answer = composeAnswer(ctx, retrieved);
  const citations = retrieved.map((r) => r.id);
  return { answer, citations };
}

export const QUICK_PROMPTS = [
  "이 광고 본 적 있어?",
  "왜 아직 안 샀어?",
  "지금 기분 어때?",
  "친구가 추천한 거 뭐였더라?",
  "가장 인상 깊었던 순간은?",
];
