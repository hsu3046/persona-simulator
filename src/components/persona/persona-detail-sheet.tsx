"use client";

import { useState } from "react";
import {
  CompassIcon,
  GearIcon,
  HeartIcon,
  LightbulbIcon,
  MegaphoneIcon,
  PathIcon,
  PencilSimpleIcon,
  PulseIcon,
  TargetIcon,
  WarningIcon,
} from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { CHANNEL_META } from "@/lib/channel-meta";
import { inferMood } from "@/lib/mood";
import {
  formatMonthlyIncome,
  HOUSING_LABEL,
  incomeBracket,
  INNOVATION_LABEL,
  LITERACY_LABEL,
  loyaltyLabel,
  MARITAL_LABEL,
  sensitivityLabel,
} from "@/lib/persona-labels";
import { cn } from "@/lib/utils";
import { usePersonaStore } from "@/stores/personas";
import type { MediaChannel, Persona } from "@/types";

import { PersonaAvatar } from "./persona-avatar";
import { EditableList } from "./editable-list";

interface SectionDef {
  key: keyof Pick<
    Persona,
    | "goals"
    | "pain_points"
    | "behaviors"
    | "triggers"
    | "barriers"
    | "resonating_messages"
    | "expected_experience"
    | "success_criteria"
  >;
  label: string;
  Icon: React.ComponentType<{ weight?: "regular" | "fill"; className?: string }>;
}

const SECTIONS: SectionDef[] = [
  { key: "goals", label: "목표", Icon: TargetIcon },
  { key: "pain_points", label: "Pain Point", Icon: WarningIcon },
  { key: "behaviors", label: "행동 패턴", Icon: PulseIcon },
  { key: "triggers", label: "행동 트리거", Icon: CompassIcon },
  { key: "barriers", label: "장벽", Icon: PathIcon },
  { key: "resonating_messages", label: "반응하는 메시지", Icon: MegaphoneIcon },
  { key: "expected_experience", label: "기대 경험", Icon: HeartIcon },
  { key: "success_criteria", label: "성공 조건", Icon: LightbulbIcon },
];

export function PersonaDetailSheet({
  personaId,
  open,
  onOpenChange,
}: {
  personaId: string | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col gap-0 p-0"
      >
        {personaId && open ? (
          <PersonaDetailContent personaId={personaId} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function PersonaDetailContent({ personaId }: { personaId: string }) {
  const update = usePersonaStore((s) => s.update);
  const persona = usePersonaStore((s) =>
    s.personas.find((p) => p.id === personaId) ?? null,
  );
  const [editingName, setEditingName] = useState<string | null>(null);

  if (!persona) return null;

  const mood = inferMood(persona.current_state.mood);

  const setField = <K extends SectionDef["key"]>(key: K, next: string[]) => {
    update(persona.id, { [key]: next } as Pick<Persona, K>);
  };

  return (
    <>
      <SheetHeader className="pl-6 pr-12 pt-6 pb-4 border-b">
          <div className="flex items-start gap-4">
            <PersonaAvatar id={persona.id} name={persona.basic.name} size={64} />
            <div className="flex-1 min-w-0">
              {editingName !== null ? (
                <Input
                  value={editingName}
                  autoFocus
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => {
                    const t = editingName.trim();
                    if (t)
                      update(persona.id, {
                        basic: { ...persona.basic, name: t },
                      });
                    setEditingName(null);
                  }}
                  onKeyDown={(e) => {
                    const composing =
                      (e.nativeEvent as { isComposing?: boolean }).isComposing ||
                      e.keyCode === 229;
                    if (e.key === "Enter" && !composing) {
                      e.currentTarget.blur();
                    }
                  }}
                  className="h-9 text-xl font-semibold"
                />
              ) : (
                <SheetTitle className="text-xl flex items-center gap-2">
                  {persona.basic.name}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditingName(persona.basic.name)}
                    aria-label="이름 편집"
                  >
                    <PencilSimpleIcon weight="regular" className="size-3" />
                  </Button>
                </SheetTitle>
              )}
              <SheetDescription className="mt-1 text-sm">
                {persona.basic.age_range} · {persona.basic.occupation}
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] gap-1 px-1.5"
                >
                  <span className="text-[12px] leading-none">{mood.emoji}</span>
                  {mood.label}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {LITERACY_LABEL[persona.basic.digital_literacy]}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {incomeBracket(persona._sim.income_decile).label}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {INNOVATION_LABEL[persona._sim.innovation_adoption]}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="px-6 py-6 space-y-7">
            {SECTIONS.map(({ key, label, Icon }) => (
              <section key={key} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Icon weight="regular" className="size-4 text-primary" />
                  <span>{label}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    ({persona[key].length})
                  </span>
                </div>
                <EditableList
                  items={persona[key]}
                  onChange={(next) => setField(key, next)}
                  placeholder={`${label} 항목 추가…`}
                  emptyLabel={`${label} 항목이 없습니다.`}
                />
              </section>
            ))}

            <Separator />

            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <GearIcon
                  weight="regular"
                  className="size-4 text-muted-foreground"
                />
                <span>시뮬레이션 보조 필드</span>
                <Badge variant="secondary" className="text-[10px]">
                  LLM 자동 추정
                </Badge>
              </div>
              <SimFields persona={persona} />
            </section>
          </div>
        </div>
    </>
  );
}

function SimFields({ persona }: { persona: Persona }) {
  const s = persona._sim;
  return (
    <div className="mt-3 space-y-4 text-sm">
      <Group title="가족·주거">
        <KV label="결혼" v={MARITAL_LABEL[s.marital_status]} />
        <KV
          label="자녀"
          v={
            s.children_count === 0
              ? "없음"
              : `${s.children_count}명 (${s.children_ages.join(", ")}세)`
          }
        />
        <KV label="가구원" v={`${s.household_size}명`} />
        <KV label="주거" v={HOUSING_LABEL[s.housing]} />
        <KV label="지역" v={`${s.region.city} ${s.region.district}`} />
      </Group>
      <Group title="경제">
        <KV label="월소득" v={formatMonthlyIncome(s.income_monthly_krw)} />
        <KV label="소득 수준" v={incomeBracket(s.income_decile).label} />
        <KV label="가격 민감도" v={sensitivityLabel(s.price_sensitivity)} />
        <KV label="브랜드 충성도" v={loyaltyLabel(s.brand_loyalty)} />
      </Group>
      <Group title="미디어 습관 (분/일)">
        <ul className="space-y-1.5 col-span-2">
          {s.media_channels.map((ch) => {
            const meta = CHANNEL_META[ch.channel as MediaChannel];
            const label = meta?.label ?? humanizeKey(ch.channel);
            return (
              <li
                key={ch.channel}
                className="flex items-center justify-between text-xs gap-2"
              >
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  {meta?.Icon && (
                    <meta.Icon
                      weight="fill"
                      className={cn("size-3.5 shrink-0", meta.fgClass)}
                    />
                  )}
                  <span className="truncate">{label}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="tabular-nums">{ch.daily_minutes}분</span>
                  <span className="text-muted-foreground">
                    · 광고 수용{" "}
                    {(ch.receptivity_to_ads * 100).toFixed(0)}%
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </Group>
      <Group title="카테고리별 기존 선호">
        <ul className="space-y-2 col-span-2 text-xs">
          {Object.entries(s.category_preferences).map(([cat, pref]) => {
            const involvement = s.involvement_by_category?.[cat];
            const ma = s.mental_availability_by_category?.[cat];
            return (
              <li key={cat} className="space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">
                    {humanizeKey(cat)}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {pref.current_brand ?? "사용 안 함"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-muted-foreground tabular-nums">
                  <span>만족 {(pref.satisfaction * 100).toFixed(0)}%</span>
                  <span>·</span>
                  <span>
                    전환의향 {(pref.willing_to_switch * 100).toFixed(0)}%
                  </span>
                  {typeof involvement === "number" && (
                    <>
                      <span>·</span>
                      <span title="ELM 관여도">
                        관여 {(involvement * 100).toFixed(0)}%
                      </span>
                    </>
                  )}
                  {typeof ma === "number" && (
                    <>
                      <span>·</span>
                      <span title="Byron Sharp Mental Availability">
                        브랜드 풀 {(ma * 100).toFixed(0)}%
                      </span>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Group>

      {s.cialdini_susceptibility && (
        <Group title="설득·영향력 민감도 (Cialdini)">
          <ul className="space-y-1 col-span-2 text-xs">
            <CialdiniRow label="사회증명 (입소문)" v={s.cialdini_susceptibility.social_proof} />
            <CialdiniRow label="권위 (전문가)" v={s.cialdini_susceptibility.authority} />
            <CialdiniRow label="희소성 (한정)" v={s.cialdini_susceptibility.scarcity} />
            <CialdiniRow label="상호성 (무료·샘플)" v={s.cialdini_susceptibility.reciprocity} />
            <CialdiniRow label="호감 (친근함)" v={s.cialdini_susceptibility.liking} />
            <CialdiniRow label="일관성 (이어가기)" v={s.cialdini_susceptibility.consistency} />
          </ul>
        </Group>
      )}

      {(s.cognitive_processing_default ||
        typeof s.loss_aversion === "number" ||
        typeof s.anchoring_susceptibility === "number" ||
        typeof s.status_quo_bias === "number") && (
        <Group title="인지·행동 경향">
          {s.cognitive_processing_default && (
            <KV
              label="의사결정 모드"
              v={
                s.cognitive_processing_default === "system1"
                  ? "System 1 (직관·빠름)"
                  : "System 2 (분석·신중)"
              }
            />
          )}
          {typeof s.loss_aversion === "number" && (
            <KV label="손실 회피" v={`${(s.loss_aversion * 100).toFixed(0)}%`} />
          )}
          {typeof s.anchoring_susceptibility === "number" && (
            <KV
              label="앵커링"
              v={`${(s.anchoring_susceptibility * 100).toFixed(0)}%`}
            />
          )}
          {typeof s.status_quo_bias === "number" && (
            <KV
              label="현상 유지 편향"
              v={`${(s.status_quo_bias * 100).toFixed(0)}%`}
            />
          )}
        </Group>
      )}
    </div>
  );
}

function CialdiniRow({ label, v }: { label: string; v: number }) {
  const pct = Math.max(0, Math.min(100, v * 100));
  return (
    <li className="space-y-0.5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary/70 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 bg-muted/30 rounded-lg p-3">
        {children}
      </div>
    </div>
  );
}

function KV({
  label,
  v,
  hint,
}: {
  label: string;
  v: string;
  /** 끝에 작은 글씨로 보조 정보 (예: "78%"). */
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between text-xs gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium truncate flex items-baseline gap-1.5">
        <span className="truncate">{v}</span>
        {hint && (
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {hint}
          </span>
        )}
      </span>
    </div>
  );
}

// LLM 이 영문 snake_case 키를 보낼 때 사람이 읽기 쉽게 변환.
// 예: "Design_Software" → "Design Software"
function humanizeKey(s: string): string {
  return s
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
