"use client";

import { useState } from "react";
import {
  CircleNotchIcon,
  SparkleIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

import {
  generatePersonas,
  generatePersonasMock,
} from "@/lib/persona-generator";
import { usePersonaStore } from "@/stores/personas";
import { useAiSettingsStore } from "@/stores/ai-settings-store";

const GOAL_EXAMPLES = [
  "MZ 직장인 캐시백 카드",
  "30대 워킹맘 가정용 식기세척기",
  "20대 대학생 OTT 구독",
];

export function PersonaCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const addMany = usePersonaStore((s) => s.addMany);
  const settings = useAiSettingsStore((s) => s.settings);
  const hydrated = useAiSettingsStore((s) => s.hydrated);
  const hasKey =
    hydrated &&
    settings.configs[settings.activeProvider].apiKey.trim().length > 0;

  const [goal, setGoal] = useState("");
  const [target, setTarget] = useState("");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setGoal("");
    setTarget("");
    setCount(5);
  };

  const submit = async (useRealAI: boolean) => {
    if (!goal.trim()) {
      toast.error("마케팅 목적을 입력해주세요");
      return;
    }
    setLoading(true);
    try {
      const fn = useRealAI ? generatePersonas : generatePersonasMock;
      const next = await fn({
        marketing_goal: goal,
        target_description: target,
        count,
      });
      addMany(next);
      toast.success(`${next.length}명 페르소나 생성됨`, {
        description: useRealAI
          ? `AI provider: ${settings.activeProvider}`
          : "카드를 클릭해 8섹션을 확인하세요.",
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error("생성 실패", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparkleIcon weight="fill" className="size-5 text-spark" />
            페르소나 생성
          </DialogTitle>
          <DialogDescription>
            마케팅 목적과 타겟을 입력하면 LLM 이 다양한 가상 고객 페르소나를
            만들어줍니다. (현재는 mock 데이터)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="goal">
              마케팅 목적 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="예: 30대 워킹맘 캐시백 카드 출시"
              disabled={loading}
            />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {GOAL_EXAMPLES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  disabled={loading}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-muted hover:bg-muted/70 transition-colors text-muted-foreground"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="target">타겟 설명 (선택)</Label>
            <Textarea
              id="target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="예: 서울 거주, 자녀 있음, 디지털 친숙도 다양, 기존 신용카드 1-2장 보유"
              disabled={loading}
              rows={6}
              className="min-h-32 leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <UsersThreeIcon weight="regular" className="size-4" />
                페르소나 수
              </Label>
              <span className="font-mono text-sm">{count} 명</span>
            </div>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[count]}
              onValueChange={(v) => {
                const n = Array.isArray(v) ? v[0] : v;
                setCount(typeof n === "number" ? n : 5);
              }}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => submit(false)}
            disabled={loading || !goal.trim()}
            title="실제 LLM 호출 없이 fixture 셔플 — 빠른 데모용"
          >
            샘플로 생성
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              onClick={() => submit(true)}
              disabled={loading || !goal.trim()}
              title={
                hasKey
                  ? `${settings.activeProvider} 사용`
                  : "AI 키 없음 — server env 폴백"
              }
            >
              {loading ? (
                <>
                  <CircleNotchIcon
                    weight="bold"
                    className="size-4 animate-spin"
                  />
                  AI 응답 대기 중…
                </>
              ) : (
                <>
                  <SparkleIcon weight="fill" className="size-4" />
                  AI 로 {count}명 생성
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
