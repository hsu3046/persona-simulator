"use client";

import { useMemo } from "react";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

import { ALL_CHANNELS, CHANNEL_META } from "@/lib/channel-meta";
import { cn } from "@/lib/utils";
import type { MediaChannel, ProductChannelPlan } from "@/types";

interface Props {
  channels: ProductChannelPlan[];
  onChange: (next: ProductChannelPlan[]) => void;
}

/**
 * 채널 리스트의 spend_share 를 합 1.0 이 되도록 자동 분배.
 * 균등 분배 (1/N) 에 ±25% 작은 가중치 노이즈 → 실제 마케팅 plan 처럼 자연스러움.
 */
function rebalance(list: ProductChannelPlan[]): ProductChannelPlan[] {
  const n = list.length;
  if (n === 0) return [];
  if (n === 1) return [{ ...list[0]!, spend_share: 1 }];

  // 각 채널에 1 ± 0.25 의 weight, 합으로 나눠 정규화.
  const weights = list.map(() => 1 + (Math.random() - 0.5) * 0.5);
  const sumW = weights.reduce((s, w) => s + w, 0);

  // 5% 단위로 반올림 + 나머지 보정
  const raw = weights.map((w) => w / sumW);
  const rounded = raw.map((r) => Math.round(r * 20) / 20); // 0.05 단위
  const sumR = rounded.reduce((s, x) => s + x, 0);
  const diff = Math.round((1 - sumR) * 20) / 20;
  if (diff !== 0 && rounded.length > 0) {
    rounded[0] = Math.max(0, (rounded[0] ?? 0) + diff);
  }

  return list.map((c, i) => ({ ...c, spend_share: rounded[i] ?? 0 }));
}

export function ChannelPlanEditor({ channels, onChange }: Props) {
  const selected = useMemo(
    () => new Set(channels.map((c) => c.channel)),
    [channels],
  );

  const totalSpend = useMemo(
    () => channels.reduce((sum, c) => sum + c.spend_share, 0),
    [channels],
  );

  // 토글 시 자동으로 spend_share 를 합 100% 가 되도록 분배.
  // 각 채널은 1/N 균등 분배 + 작은 랜덤 가중치 (실제 마케터의 직관과 비슷).
  const toggle = (ch: MediaChannel) => {
    if (selected.has(ch)) {
      const remaining = channels.filter((c) => c.channel !== ch);
      onChange(rebalance(remaining));
    } else {
      onChange(
        rebalance([
          ...channels,
          { channel: ch, spend_share: 0, creative_summary: "" },
        ]),
      );
    }
  };

  const update = (ch: MediaChannel, patch: Partial<ProductChannelPlan>) => {
    onChange(channels.map((c) => (c.channel === ch ? { ...c, ...patch } : c)));
  };

  const remove = (ch: MediaChannel) => {
    onChange(channels.filter((c) => c.channel !== ch));
  };

  const normalize = () => {
    if (channels.length === 0) return;
    if (totalSpend <= 0) {
      // 모두 0 → 균등 분배 (랜덤 가중치 적용)
      onChange(rebalance(channels));
      return;
    }
    // 비율 유지하며 1.0 으로 스케일
    onChange(
      channels.map((c) => ({
        ...c,
        spend_share: c.spend_share / totalSpend,
      })),
    );
  };

  const within1 = Math.abs(totalSpend - 1) < 0.01;

  return (
    <div className="space-y-5">
      {/* 채널 선택 그리드 */}
      <div>
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <div className="flex items-baseline gap-2">
            <Label>채널 선택</Label>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {selected.size}개 선택
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            선택 시 예산이 자동으로 분배됩니다
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ALL_CHANNELS.map((ch) => {
            const meta = CHANNEL_META[ch];
            const active = selected.has(ch);
            return (
              <button
                key={ch}
                type="button"
                onClick={() => toggle(ch)}
                className={cn(
                  "relative flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors text-left min-w-0",
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40 hover:bg-muted/40",
                )}
              >
                <meta.Icon
                  weight={active ? "fill" : "regular"}
                  className={cn("size-4 shrink-0", active && meta.fgClass)}
                />
                <span className="flex-1 min-w-0 truncate">{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 채널 상세 */}
      {channels.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>예산 분배 & 크리에이티브</Label>
            <div className="flex items-center gap-2">
              <Badge
                variant={within1 ? "secondary" : "destructive"}
                className="font-mono text-[10px]"
              >
                합계 {(totalSpend * 100).toFixed(0)}%
              </Badge>
              {!within1 && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={normalize}
                  type="button"
                >
                  100% 로 정규화
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {channels.map((c) => {
              const meta = CHANNEL_META[c.channel];
              return (
                <Card key={c.channel} className="border-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <meta.Icon
                        weight="fill"
                        className={cn("size-4 shrink-0", meta.fgClass)}
                      />
                      <span className="font-medium text-sm">{meta.label}</span>
                      <span className="ml-auto font-mono text-xs text-muted-foreground">
                        {(c.spend_share * 100).toFixed(0)}%
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => remove(c.channel)}
                        aria-label="채널 제거"
                      >
                        <TrashIcon weight="regular" className="size-3.5" />
                      </Button>
                    </div>

                    <Slider
                      min={0}
                      max={1}
                      step={0.05}
                      value={[c.spend_share]}
                      onValueChange={(v) => {
                        const n = Array.isArray(v) ? v[0] : v;
                        update(c.channel, {
                          spend_share: typeof n === "number" ? n : 0,
                        });
                      }}
                    />

                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`creative-${c.channel}`}
                        className="text-xs text-muted-foreground"
                      >
                        크리에이티브 카피
                      </Label>
                      <Textarea
                        id={`creative-${c.channel}`}
                        value={c.creative_summary}
                        onChange={(e) =>
                          update(c.channel, { creative_summary: e.target.value })
                        }
                        rows={2}
                        placeholder="예: 20-30대 직장인 일상 + '월 5만원 더' 카피"
                        className="text-sm"
                      />
                    </div>

                    <TargetingRow
                      value={c.targeting}
                      onChange={(t) => update(c.channel, { targeting: t })}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {channels.length === 0 && (
        <div className="border border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground">
          <PlusIcon weight="bold" className="size-4 inline mr-1" />
          최소 1개 이상의 채널을 선택하세요.
        </div>
      )}
    </div>
  );
}

function TargetingRow({
  value,
  onChange,
}: {
  value: ProductChannelPlan["targeting"];
  onChange: (next: ProductChannelPlan["targeting"]) => void;
}) {
  const ageMin = value?.age_range?.[0] ?? "";
  const ageMax = value?.age_range?.[1] ?? "";
  const regions = value?.regions?.join(", ") ?? "";

  return (
    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground shrink-0">연령</span>
        <Input
          value={ageMin}
          onChange={(e) => {
            const min = e.target.value === "" ? undefined : Number(e.target.value);
            const max = value?.age_range?.[1];
            onChange({
              ...value,
              age_range:
                min !== undefined || max !== undefined
                  ? [min ?? 0, max ?? 99]
                  : undefined,
            });
          }}
          placeholder="20"
          className="h-7 text-xs"
          type="number"
          min={0}
          max={99}
        />
        <span>~</span>
        <Input
          value={ageMax}
          onChange={(e) => {
            const max = e.target.value === "" ? undefined : Number(e.target.value);
            const min = value?.age_range?.[0];
            onChange({
              ...value,
              age_range:
                min !== undefined || max !== undefined
                  ? [min ?? 0, max ?? 99]
                  : undefined,
            });
          }}
          placeholder="39"
          className="h-7 text-xs"
          type="number"
          min={0}
          max={99}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground shrink-0">지역</span>
        <Input
          value={regions}
          onChange={(e) => {
            const arr = e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            onChange({
              ...value,
              regions: arr.length === 0 ? undefined : arr,
            });
          }}
          placeholder="서울, 경기"
          className="h-7 text-xs"
        />
      </div>
    </div>
  );
}
