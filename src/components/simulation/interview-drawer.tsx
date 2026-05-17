"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowsInIcon,
  ArrowsOutIcon,
  ChatCircleDotsIcon,
  CircleNotchIcon,
  FilmStripIcon,
  MegaphoneIcon,
  PaperPlaneRightIcon,
  SparkleIcon,
  XIcon,
} from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import { PersonaAvatar } from "@/components/persona/persona-avatar";
import {
  answerInterviewMock,
  QUICK_PROMPTS,
} from "@/lib/interview-mock";
import { askInterview } from "@/lib/interview-client";
import { hasBYOK } from "@/lib/ai-settings";
import { formatSimTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useInterviewStore } from "@/stores/interview";
import { usePersonaStore } from "@/stores/personas";
import { useProductStore } from "@/stores/products";
import { useSimStore } from "@/stores/simulation";
import type { FeedEntry } from "@/types";

const EMPTY_FEED: FeedEntry[] = [];

function getTs(e: FeedEntry): string {
  return e.kind === "life"
    ? e.data.sim_timestamp
    : e.kind === "exposure"
      ? e.data.sim_timestamp
      : e.data.sim_timestamp;
}

export function InterviewDrawer() {
  const open = useInterviewStore((s) => s.open);
  const personaId = useInterviewStore((s) => s.personaId);
  const pinnedSimTime = useInterviewStore((s) => s.pinnedSimTime);
  const messages = useInterviewStore((s) => s.messages);
  const loading = useInterviewStore((s) => s.loading);
  const close = useInterviewStore((s) => s.close);
  const appendUser = useInterviewStore((s) => s.appendUser);
  const appendPersona = useInterviewStore((s) => s.appendPersona);
  const setLoading = useInterviewStore((s) => s.setLoading);
  const resetConversation = useInterviewStore((s) => s.resetConversation);

  const persona = usePersonaStore((s) =>
    personaId ? s.personas.find((p) => p.id === personaId) ?? null : null,
  );
  const productId = useSimStore((s) => s.productId);
  const product = useProductStore((s) =>
    productId ? s.products.find((p) => p.id === productId) ?? null : null,
  );
  const feedMap = useSimStore((s) => s.feed);
  const feed = personaId ? feedMap[personaId] ?? EMPTY_FEED : EMPTY_FEED;

  const [draft, setDraft] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMsgCountRef = useRef(0);

  // entry id → 간략 메타 매핑 (citation chip 표시용)
  const entryById = new Map<
    string,
    { ts: string; kind: FeedEntry["kind"]; label: string }
  >();
  for (const e of feed) {
    const id =
      e.kind === "life"
        ? e.data.id
        : e.kind === "exposure"
          ? e.data.id
          : e.data.id;
    const ts = getTs(e);
    let label = "";
    if (e.kind === "life") {
      label = e.data.action_summary.slice(0, 28);
    } else if (e.kind === "exposure") {
      label = `${e.data.channel} 광고`;
    } else {
      label = "단계 전환";
    }
    entryById.set(id, { ts, kind: e.kind, label });
  }

  const scrollToEntry = (id: string) => {
    const el = document.querySelector(
      `[data-entry-id="${CSS.escape(id)}"]`,
    ) as HTMLElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    // 깜빡임 트리거 — store 의 highlightIds 를 잠시 설정
    useInterviewStore.setState({ highlightIds: [id] });
    setTimeout(() => useInterviewStore.setState({ highlightIds: [] }), 1500);
  };

  // 새 메시지 도착 시 자동 스크롤
  useEffect(() => {
    if (messages.length > lastMsgCountRef.current) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
    lastMsgCountRef.current = messages.length;
  }, [messages.length]);

  const ask = async (question: string) => {
    if (!question.trim() || !persona || loading) return;
    appendUser(question);
    setDraft("");
    setLoading(true);
    try {
      const cutoff = pinnedSimTime ?? "9999-12-31T23:59:59";
      const upTo = feed.filter((e) => getTs(e) <= cutoff);
      const prev = messages.map((m) => ({ role: m.role, content: m.content }));

      // BYOK 있으면 실제 LLM, 없으면 mock 폴백
      if (hasBYOK()) {
        try {
          const result = await askInterview({
            persona,
            product,
            feed: upTo,
            pinnedSimTime,
            question,
            prevMessages: prev,
          });
          appendPersona(result.answer, result.citations);
          return;
        } catch (err) {
          console.warn("[interview] LLM 실패, mock 폴백:", err);
        }
      }

      const fallback = await answerInterviewMock({
        persona,
        product,
        feed: upTo,
        question,
        prevMessages: prev,
      });
      appendPersona(fallback.answer, fallback.citations);
    } finally {
      setLoading(false);
    }
  };

  if (!persona) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="drawer"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 260, damping: 32 }}
          className={cn(
            "fixed left-0 right-0 z-40 bg-card border-t shadow-2xl flex flex-col",
            fullscreen
              ? "top-0 bottom-0 max-h-none"
              : "bottom-0 h-[55vh] max-h-[600px]",
          )}
        >
          {/* 헤더 */}
          <header className="flex items-center gap-3 px-5 py-3 border-b">
            <PersonaAvatar id={persona.id} name={persona.basic.name} size={36} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate">
                  {persona.basic.name}
                </h3>
                <Badge variant="secondary" className="text-[10px]">
                  <ChatCircleDotsIcon weight="fill" className="size-3" />
                  인터뷰
                </Badge>
                {pinnedSimTime && (
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {formatSimTime(pinnedSimTime)} 시점
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                이 시점까지 페르소나가 경험한 것을 바탕으로 답변합니다.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetConversation();
              }}
              disabled={messages.length === 0 || loading}
            >
              대화 초기화
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setFullscreen((v) => !v)}
              aria-label={fullscreen ? "축소" : "전체화면"}
              title={fullscreen ? "축소" : "전체화면"}
            >
              {fullscreen ? (
                <ArrowsInIcon weight="bold" className="size-4" />
              ) : (
                <ArrowsOutIcon weight="bold" className="size-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setFullscreen(false);
                close();
              }}
              aria-label="닫기"
            >
              <XIcon weight="bold" className="size-4" />
            </Button>
          </header>

          {/* 메시지 영역 */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4">
            <div className="max-w-3xl mx-auto space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    페르소나에게 질문해 보세요.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => ask(p)}
                        className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex gap-2",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {m.role === "persona" && (
                    <PersonaAvatar
                      id={persona.id}
                      name={persona.basic.name}
                      size={28}
                      className="mt-1"
                    />
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md",
                    )}
                  >
                    <p
                      dangerouslySetInnerHTML={{ __html: m.content }}
                      className="[&>code]:font-mono"
                    />
                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/30 flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground">
                          근거가 된 기록 ({m.citations.length})
                        </span>
                        <div className="flex flex-col gap-1">
                          {m.citations.slice(0, 4).map((id) => {
                            const meta = entryById.get(id);
                            if (!meta) return null;
                            const KindIcon =
                              meta.kind === "exposure"
                                ? MegaphoneIcon
                                : meta.kind === "funnel"
                                  ? SparkleIcon
                                  : FilmStripIcon;
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => scrollToEntry(id)}
                                className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-background/60 hover:bg-background border border-border/50 transition-colors text-left"
                                title="피드에서 이 기록으로 이동"
                              >
                                <KindIcon
                                  weight="fill"
                                  className="size-3 shrink-0 text-muted-foreground"
                                />
                                <span className="font-mono text-muted-foreground shrink-0">
                                  {formatSimTime(meta.ts)}
                                </span>
                                <span className="truncate text-foreground/80">
                                  {meta.label}
                                </span>
                              </button>
                            );
                          })}
                          {m.citations.length > 4 && (
                            <span className="text-[10px] text-muted-foreground pl-1">
                              +{m.citations.length - 4} 더
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 items-center text-xs text-muted-foreground pl-9">
                  <CircleNotchIcon
                    weight="bold"
                    className="size-3.5 animate-spin"
                  />
                  생각 중…
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <Separator />

          {/* 입력 + 빠른 질문 */}
          <div className="px-5 py-3 space-y-2 bg-muted/20">
            {messages.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.slice(0, 4).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => ask(p)}
                    disabled={loading}
                    className="text-[11px] px-2 py-1 rounded-full border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  const composing =
                    (e.nativeEvent as { isComposing?: boolean }).isComposing ||
                    e.keyCode === 229;
                  if (e.key === "Enter" && !e.shiftKey && !composing) {
                    e.preventDefault();
                    ask(draft);
                  }
                }}
                placeholder={`${persona.basic.name} 에게 질문하기…`}
                rows={1}
                className="flex-1 min-h-[40px] max-h-32 resize-none"
                disabled={loading}
              />
              <Button
                onClick={() => ask(draft)}
                disabled={loading || !draft.trim()}
                size="icon"
                aria-label="질문 보내기"
              >
                <PaperPlaneRightIcon weight="fill" className="size-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
