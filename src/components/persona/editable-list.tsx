"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 페르소나 섹션 (목표/Pain Point 등) 의 string[] 인라인 편집기.
// shadcn Input + 추가/삭제 버튼.

export function EditableList({
  items,
  onChange,
  placeholder,
  emptyLabel,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  emptyLabel?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setDraft("");
  };

  const removeAt = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const updateAt = (idx: number, value: string) => {
    onChange(items.map((v, i) => (i === idx ? value : v)));
  };

  return (
    <div className="space-y-1.5">
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground italic py-1">
          {emptyLabel ?? "아직 비어있음"}
        </p>
      )}
      {items.map((v, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Input
            value={v}
            onChange={(e) => updateAt(i, e.target.value)}
            className="h-8 flex-1"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => removeAt(i)}
            aria-label="항목 삭제"
          >
            <TrashIcon weight="regular" className="size-3.5" />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-1.5 pt-1">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            const composing =
              (e.nativeEvent as { isComposing?: boolean }).isComposing ||
              e.keyCode === 229;
            if (e.key === "Enter" && !composing) {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder ?? "항목 추가…"}
          className="h-8 flex-1"
        />
        <Button
          variant="outline"
          size="icon-sm"
          onClick={add}
          disabled={!draft.trim()}
          aria-label="항목 추가"
        >
          <PlusIcon weight="bold" className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
