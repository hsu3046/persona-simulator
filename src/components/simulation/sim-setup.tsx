"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  CalendarBlankIcon,
  CheckIcon,
  PackageIcon,
  PlayIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-shell";
import { PersonaAvatar } from "@/components/persona/persona-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CHANNEL_META } from "@/lib/channel-meta";
import {
  SIM_DURATIONS,
  type SimDuration,
} from "@/lib/sim-duration";
import { cn } from "@/lib/utils";
import { usePersonaStore } from "@/stores/personas";
import { useProductStore } from "@/stores/products";
import { useSimStore } from "@/stores/simulation";

export function SimSetup({ onReady }: { onReady: () => void }) {
  const personas = usePersonaStore((s) => s.personas);
  const products = useProductStore((s) => s.products);
  const currentProductId = useSimStore((s) => s.productId);
  const currentPersonaIds = useSimStore((s) => s.personaIds);
  const currentDuration = useSimStore((s) => s.duration);
  const configure = useSimStore((s) => s.configure);

  const [selectedProduct, setSelectedProduct] = useState<string | null>(
    currentProductId ?? products[0]?.id ?? null,
  );
  const [selectedPersonas, setSelectedPersonas] = useState<Set<string>>(
    new Set(currentPersonaIds.length > 0 ? currentPersonaIds : personas.slice(0, 3).map((p) => p.id)),
  );
  const [selectedDuration, setSelectedDuration] =
    useState<SimDuration>(currentDuration);

  const togglePersona = (id: string) => {
    setSelectedPersonas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const start = () => {
    if (!selectedProduct) {
      toast.error("제품·서비스를 선택하세요");
      return;
    }
    if (selectedPersonas.size === 0) {
      toast.error("페르소나를 1명 이상 선택하세요");
      return;
    }
    configure(
      selectedProduct,
      Array.from(selectedPersonas),
      selectedDuration,
    );
    onReady();
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container max-w-6xl mx-auto px-6 py-10 space-y-10">
        <PageHeader
          phase="Phase 3 — 시뮬레이션"
          title="시뮬레이션 설정"
          description="제품·서비스 1개 + 페르소나 1명 이상을 선택한 후 재생하세요."
        />

        {/* 제품 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <PackageIcon weight="fill" className="size-4 text-primary" />
              제품·서비스 / 캠페인
            </h2>
            {products.length === 0 && (
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href="/products" />}
              >
                등록하러 가기
              </Button>
            )}
          </div>

          {products.length === 0 ? (
            <EmptyHint
              message="아직 등록된 제품·서비스가 없습니다."
              cta="/products"
              ctaLabel="제품·서비스 등록"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.map((p) => {
                const active = p.id === selectedProduct;
                return (
                  <motion.button
                    key={p.id}
                    type="button"
                    whileHover={{ y: -2 }}
                    onClick={() => setSelectedProduct(p.id)}
                    className="text-left"
                  >
                    <Card
                      className={cn(
                        "border-2 transition-colors",
                        active ? "border-primary" : "border-border",
                      )}
                      style={{
                        borderTopColor: active
                          ? p.brand_color ?? "var(--primary)"
                          : undefined,
                        borderTopWidth: 4,
                      }}
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start gap-2">
                          <div
                            className="size-10 rounded-md flex items-center justify-center text-white shrink-0"
                            style={{
                              background: p.brand_color ?? "var(--primary)",
                            }}
                          >
                            <PackageIcon weight="fill" className="size-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {p.category}
                            </p>
                          </div>
                          {active && (
                            <CheckIcon
                              weight="bold"
                              className="size-4 text-primary"
                            />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {p.channels.slice(0, 5).map((c) => {
                            const meta = CHANNEL_META[c.channel];
                            return (
                              <span
                                key={c.channel}
                                title={meta.label}
                                aria-label={meta.label}
                              >
                                <meta.Icon
                                  weight="fill"
                                  className={cn("size-3.5", meta.fgClass)}
                                />
                              </span>
                            );
                          })}
                          {p.channels.length > 5 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{p.channels.length - 5}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.button>
                );
              })}
            </div>
          )}
        </section>

        {/* 페르소나 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <UsersThreeIcon weight="fill" className="size-4 text-primary" />
              참여 페르소나 ({selectedPersonas.size}/{personas.length})
            </h2>
            {personas.length === 0 && (
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href="/personas" />}
              >
                생성하러 가기
              </Button>
            )}
          </div>

          {personas.length === 0 ? (
            <EmptyHint
              message="아직 등록된 페르소나가 없습니다."
              cta="/personas"
              ctaLabel="페르소나 생성"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {personas.map((p) => {
                const active = selectedPersonas.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePersona(p.id)}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg border-2 text-left transition-colors",
                      active
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/40",
                    )}
                  >
                    <PersonaAvatar id={p.id} name={p.basic.name} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {p.basic.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.basic.age_range} · {p.basic.occupation}
                      </p>
                    </div>
                    {active && (
                      <CheckIcon
                        weight="bold"
                        className="size-4 text-primary shrink-0"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 시뮬 기간 */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <CalendarBlankIcon weight="fill" className="size-4 text-primary" />
            시뮬레이션 기간
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["24h", "7d", "30d"] as SimDuration[]).map((d) => {
              const meta = SIM_DURATIONS[d];
              const active = selectedDuration === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDuration(d)}
                  className={cn(
                    "text-left p-4 rounded-lg border-2 transition-colors",
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-lg font-bold">{meta.label}</span>
                    {active && (
                      <CheckIcon
                        weight="bold"
                        className="size-4 text-primary"
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {meta.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <div className="sticky bottom-4 z-10 flex justify-end pt-2">
          <Button
            size="lg"
            onClick={start}
            disabled={!selectedProduct || selectedPersonas.size === 0}
          >
            <PlayIcon weight="fill" className="size-4" />
            시뮬레이션 시작
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyHint({
  message,
  cta,
  ctaLabel,
}: {
  message: string;
  cta: string;
  ctaLabel: string;
}) {
  return (
    <div className="border border-dashed rounded-lg p-6 text-center bg-muted/20 text-sm text-muted-foreground">
      <p>{message}</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        nativeButton={false}
        render={<Link href={cta} />}
      >
        {ctaLabel}
      </Button>
    </div>
  );
}
