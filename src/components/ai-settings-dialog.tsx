"use client";

import { useState } from "react";
import {
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  RobotIcon,
} from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  PROVIDER_META,
  type ProviderName,
} from "@/lib/ai-settings";
import { cn } from "@/lib/utils";
import { useAiSettingsStore } from "@/stores/ai-settings-store";

const PROVIDERS: ProviderName[] = [
  "google",
  "openai",
  "anthropic",
  "openrouter",
];

export function AiSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const hydrated = useAiSettingsStore((s) => s.hydrated);
  const settings = useAiSettingsStore((s) => s.settings);
  const setActive = useAiSettingsStore((s) => s.setActive);
  const setApiKey = useAiSettingsStore((s) => s.setApiKey);
  const setModel = useAiSettingsStore((s) => s.setModel);

  if (!hydrated) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <RobotIcon weight="fill" className="size-5 text-primary" />
            AI 설정
          </DialogTitle>
          <DialogDescription>
            본인의 API 키를 등록해 페르소나 생성·시뮬·인터뷰에 사용합니다. 키는
            브라우저에만 저장되고 매 요청 시 서버를 거쳐 provider 로 직접 전달됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          <Tabs
            value={settings.activeProvider}
            onValueChange={(v) => setActive(v as ProviderName)}
          >
            <TabsList className="grid w-full grid-cols-4">
              {PROVIDERS.map((p) => {
                const meta = PROVIDER_META[p];
                const filled = settings.configs[p].apiKey.trim().length > 0;
                return (
                  <TabsTrigger key={p} value={p}>
                    <span className="flex items-center gap-1.5">
                      {filled && (
                        <CheckCircleIcon
                          weight="fill"
                          className="size-3.5 text-primary"
                        />
                      )}
                      {meta.label}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {PROVIDERS.map((p) => (
              <TabsContent key={p} value={p} className="mt-5 space-y-4">
                <ProviderForm
                  key={p}
                  providerName={p}
                  apiKey={settings.configs[p].apiKey}
                  model={settings.configs[p].model}
                  onApiKeyChange={(v) => setApiKey(p, v)}
                  onModelChange={(v) => setModel(p, v)}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/20 flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {settings.configs[settings.activeProvider].apiKey ? (
              <span className="inline-flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px]">
                  활성: {PROVIDER_META[settings.activeProvider].label}
                </Badge>
                자동 저장됨
              </span>
            ) : (
              <span>API 키 미입력</span>
            )}
          </div>
          <Button onClick={() => onOpenChange(false)}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProviderForm({
  providerName,
  apiKey,
  model,
  onApiKeyChange,
  onModelChange,
}: {
  // providerName 이 바뀌면 key 로 컴포넌트가 unmount → state 자연 리셋
  providerName: ProviderName;
  apiKey: string;
  model: string;
  onApiKeyChange: (v: string) => void;
  onModelChange: (v: string) => void;
}) {
  const meta = PROVIDER_META[providerName];
  const [reveal, setReveal] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`api-${providerName}`} className="flex items-center gap-1.5">
          <KeyIcon weight="regular" className="size-4" />
          API Key
        </Label>
        <div className="relative">
          <Input
            id={`api-${providerName}`}
            type={reveal ? "text" : "password"}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder={meta.keyExample}
            className="font-mono text-sm pr-9"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={reveal ? "키 가리기" : "키 보기"}
          >
            {reveal ? (
              <EyeSlashIcon weight="regular" className="size-4" />
            ) : (
              <EyeIcon weight="regular" className="size-4" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`model-${providerName}`}>모델 ID (선택)</Label>
        <Input
          id={`model-${providerName}`}
          value={model || meta.defaultModel}
          onChange={(e) => onModelChange(e.target.value)}
          placeholder={meta.defaultModel}
          className="font-mono text-sm"
        />
      </div>

      <div className="text-[11px] text-muted-foreground border-t pt-3">
        키 발급:{" "}
        <a
          href={KEY_ISSUE_URLS[providerName]}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-foreground"
        >
          {KEY_ISSUE_LABELS[providerName]}
        </a>
      </div>
    </div>
  );
}

const KEY_ISSUE_URLS: Record<ProviderName, string> = {
  openrouter: "https://openrouter.ai/keys",
  openai: "https://platform.openai.com/api-keys",
  anthropic: "https://console.anthropic.com/settings/keys",
  google: "https://aistudio.google.com/apikey",
};

const KEY_ISSUE_LABELS: Record<ProviderName, string> = {
  openrouter: "openrouter.ai/keys",
  openai: "platform.openai.com",
  anthropic: "console.anthropic.com",
  google: "aistudio.google.com",
};

/** Site header 의 nav 와 동일 스타일의 트리거. */
export function AiSettingsButton({ onClick }: { onClick: () => void }) {
  const hydrated = useAiSettingsStore((s) => s.hydrated);
  const settings = useAiSettingsStore((s) => s.settings);
  const hasKey =
    hydrated &&
    settings.configs[settings.activeProvider].apiKey.trim().length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="AI 설정"
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
        hasKey
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
      )}
    >
      <RobotIcon weight={hasKey ? "fill" : "regular"} className="size-4" />
      <span className="hidden sm:inline">
        {hasKey ? PROVIDER_META[settings.activeProvider].label : "AI 설정"}
      </span>
    </button>
  );
}
