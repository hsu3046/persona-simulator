"use client";

import { motion } from "motion/react";
import {
  CopyIcon,
  DotsThreeIcon,
  TrashIcon,
} from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { inferMood } from "@/lib/mood";
import {
  incomeBracket,
  INNOVATION_LABEL,
  INNOVATION_HINT,
  LITERACY_LABEL,
  loyaltyLabel,
  sensitivityLabel,
} from "@/lib/persona-labels";
import type { Persona } from "@/types";

import { PersonaAvatar } from "./persona-avatar";

export function PersonaCard({
  persona,
  index = 0,
  onClick,
  onDuplicate,
  onRemove,
}: {
  persona: Persona;
  index?: number;
  onClick?: () => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
}) {
  const mood = inferMood(persona.current_state.mood);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      whileHover={{ y: -3 }}
    >
      <Card
        className="h-full cursor-pointer transition-colors hover:border-primary/40"
        onClick={onClick}
      >
        <CardContent className="p-5 space-y-4">
          <header className="flex items-start gap-3">
            <PersonaAvatar id={persona.id} name={persona.basic.name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base truncate">
                  {persona.basic.name}
                </h3>
                <span
                  className="shrink-0 text-base leading-none"
                  title={mood.label}
                  aria-label={`기분: ${mood.label}`}
                >
                  {mood.emoji}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {persona.basic.age_range} · {persona.basic.occupation}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="페르소나 메뉴"
                  >
                    <DotsThreeIcon weight="bold" className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    <CopyIcon weight="regular" className="size-4" />
                    복제
                  </DropdownMenuItem>
                )}
                {onRemove && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onRemove}
                      className="text-destructive focus:text-destructive"
                    >
                      <TrashIcon weight="regular" className="size-4" />
                      삭제
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <div className="space-y-2.5 text-sm">
            <Section label="핵심 목표">
              <ul className="space-y-0.5">
                {persona.goals.slice(0, 2).map((g, i) => (
                  <li
                    key={i}
                    className="text-foreground line-clamp-1 flex items-baseline gap-1.5"
                  >
                    <span className="text-primary">·</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </Section>
            <Section label="Pain Point">
              <ul className="space-y-0.5">
                {persona.pain_points.slice(0, 2).map((g, i) => (
                  <li
                    key={i}
                    className="text-muted-foreground line-clamp-1 flex items-baseline gap-1.5"
                  >
                    <span className="text-destructive">·</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Badge variant="outline" className="text-[10px]">
              {LITERACY_LABEL[persona.basic.digital_literacy]}
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px]"
              title={incomeBracket(persona._sim.income_decile).monthlyRangeKrw}
            >
              {incomeBracket(persona._sim.income_decile).label}
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px]"
              title={INNOVATION_HINT[persona._sim.innovation_adoption]}
            >
              {INNOVATION_LABEL[persona._sim.innovation_adoption]}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {sensitivityLabel(persona._sim.price_sensitivity)}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {loyaltyLabel(persona._sim.brand_loyalty)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      {children}
    </div>
  );
}
