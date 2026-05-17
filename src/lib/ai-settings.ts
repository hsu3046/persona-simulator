/**
 * AI Settings — BYOK (Bring Your Own Key).
 * dreamfulness/lib/ai-settings.ts 패턴 그대로.
 *
 * 데이터 구조: provider 별 apiKey/model 을 각각 보관. activeProvider 만 server 에 전달.
 * localStorage 저장. server 는 매 요청 사용 후 폐기 (저장·로깅 X).
 *
 * 보안 함의:
 *  - localStorage 는 동일 origin XSS 노출. POC 단계에서는 BYOK 의식하고 사용 가정.
 *  - 실서비스 단계에서는 server-side 키 관리 + auth 로 이동.
 */

export type ProviderName = "openrouter" | "openai" | "anthropic" | "google";

export type ProviderConfig = { apiKey: string; model: string };

export type AiSettings = {
  activeProvider: ProviderName;
  configs: Record<ProviderName, ProviderConfig>;
};

export type ActiveSettings = {
  provider: ProviderName;
  apiKey: string;
  model: string;
};

export const PROVIDER_META: Record<
  ProviderName,
  { label: string; defaultModel: string; keyExample: string; modelHint: string }
> = {
  openrouter: {
    label: "OpenRouter",
    defaultModel: "deepseek/deepseek-v4-pro",
    keyExample: "sk-or-v1-...",
    modelHint: "anthropic/claude-sonnet-4-6 · openai/gpt-5.4-mini · deepseek/deepseek-v4-pro",
  },
  openai: {
    label: "OpenAI",
    defaultModel: "gpt-5.4-mini",
    keyExample: "sk-proj-...",
    modelHint: "gpt-5.4-mini · gpt-5 · gpt-4o · o4-mini",
  },
  anthropic: {
    label: "Anthropic",
    defaultModel: "claude-sonnet-4-6",
    keyExample: "sk-ant-...",
    modelHint: "claude-sonnet-4-6 · claude-haiku-4-5 · claude-opus-4-7",
  },
  google: {
    label: "Google",
    defaultModel: "gemini-3-flash-preview",
    keyExample: "AIzaSy...",
    modelHint: "gemini-3-flash · gemini-3-pro · gemini-2.5-flash",
  },
};

const STORAGE_KEY = "ps:ai-settings";
const PROVIDERS: ProviderName[] = [
  "openrouter",
  "openai",
  "anthropic",
  "google",
];

function emptyConfigs(): Record<ProviderName, ProviderConfig> {
  return {
    openrouter: { apiKey: "", model: "" },
    openai: { apiKey: "", model: "" },
    anthropic: { apiKey: "", model: "" },
    google: { apiKey: "", model: "" },
  };
}

function isProvider(v: unknown): v is ProviderName {
  return PROVIDERS.includes(v as ProviderName);
}

function parseSettings(raw: string): AiSettings | null {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (
      isProvider(o.activeProvider) &&
      o.configs &&
      typeof o.configs === "object"
    ) {
      const configs = emptyConfigs();
      for (const p of PROVIDERS) {
        const cfg = (o.configs as Record<string, unknown>)[p] as
          | Record<string, unknown>
          | undefined;
        if (cfg) {
          configs[p] = {
            apiKey: typeof cfg.apiKey === "string" ? cfg.apiKey : "",
            model: typeof cfg.model === "string" ? cfg.model : "",
          };
        }
      }
      return { activeProvider: o.activeProvider, configs };
    }
    return null;
  } catch {
    return null;
  }
}

export function loadSettings(): AiSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseSettings(raw);
  } catch {
    return null;
  }
}

export const AI_SETTINGS_CHANGED_EVENT = "ps:ai-settings-changed";

export function saveSettings(s: AiSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    window.dispatchEvent(new Event(AI_SETTINGS_CHANGED_EVENT));
  } catch {
    /* quota / privacy mode */
  }
}

export function clearSettings(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(AI_SETTINGS_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

/**
 * 활성 provider 의 config 만 추출. server 로 전달할 때 사용.
 * settings 없거나 활성 provider 의 apiKey 비어있으면 null → server 가 env 폴백.
 */
export function getActiveSettings(): ActiveSettings | null {
  const s = loadSettings();
  if (!s) return null;
  const cfg = s.configs[s.activeProvider];
  if (!cfg || !cfg.apiKey.trim()) return null;
  return {
    provider: s.activeProvider,
    apiKey: cfg.apiKey,
    model: cfg.model,
  };
}

/** 사용자가 BYOK 설정해놨는지 여부 (UI 의 "키 등록됨" 배지용). */
export function hasBYOK(): boolean {
  return getActiveSettings() !== null;
}
