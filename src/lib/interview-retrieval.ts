// pinnedSimTime 까지의 feed 에서 질문에 관련된 entry 를 retrieve.
// Stanford Smallville 의 recency × similarity × importance 의 가벼운 휴리스틱 버전.
// 정식 pgvector 도입 전까지 keyword + recency 기반.

import type { FeedEntry } from "@/types";

const KW_AD = ["광고", "노출", "본", "봤어", "본적", "스폰서", "캠페인"];
const KW_BUY = ["사", "구매", "왜", "안", "안 샀", "가입", "결제", "선택"];
const KW_FRIEND = ["친구", "동료", "추천", "지인", "주변"];
const KW_MOOD = ["기분", "느낌", "어땠", "어떤 마음", "감정"];

export function getEntryId(e: FeedEntry): string {
  return e.kind === "life"
    ? e.data.id
    : e.kind === "exposure"
      ? e.data.id
      : e.data.id;
}

export function getEntryTs(e: FeedEntry): string {
  return e.kind === "life"
    ? e.data.sim_timestamp
    : e.kind === "exposure"
      ? e.data.sim_timestamp
      : e.data.sim_timestamp;
}

function scoreEntry(entry: FeedEntry, question: string): number {
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
    const text = (
      entry.data.message_received +
      " " +
      entry.data.internal_reasoning
    ).toLowerCase();
    if (text.includes(q.slice(0, 4))) s += 1;
  } else if (entry.kind === "life") {
    s += 1;
    if (askMood) s += 3;
    if (entry.data.type === "consumption" && askBuy) s += 2;
    if (entry.data.type === "reflection") s += 2;
    const text = (entry.data.diary + entry.data.action_summary).toLowerCase();
    for (const k of [...KW_AD, ...KW_BUY, ...KW_FRIEND]) {
      if (text.includes(k.toLowerCase())) s += 1;
    }
  } else {
    s += 2;
    if (askBuy) s += 3;
  }
  return s;
}

function recencyBoost(entry: FeedEntry, all: FeedEntry[]): number {
  const idx = all.findIndex((e) => getEntryId(e) === getEntryId(entry));
  if (idx < 0) return 0;
  return (idx / Math.max(1, all.length - 1)) * 2;
}

export interface RankedEntry {
  entry: FeedEntry;
  id: string;
  ts: string;
  score: number;
}

export function retrieveRelevant(
  feed: FeedEntry[],
  question: string,
  max = 6,
): RankedEntry[] {
  const ranked: RankedEntry[] = feed.map((entry) => ({
    entry,
    id: getEntryId(entry),
    ts: getEntryTs(entry),
    score: scoreEntry(entry, question) + recencyBoost(entry, feed),
  }));
  ranked.sort((a, b) => b.score - a.score);
  return ranked.filter((r) => r.score >= 2).slice(0, max);
}
