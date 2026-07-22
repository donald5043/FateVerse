import type { ChatCompletionRequestNonStreaming, ChatCompletionRequestStreaming, MLCEngineInterface } from '@mlc-ai/web-llm';
import type { AiFateReport, FateReportInput } from '../types/fate';
import { generateFallbackReport } from './fallback-report';
import { DEFAULT_LOCAL_MODEL_ID } from './model-options';
import { buildFastReportUserPrompt, SYSTEM_PROMPT } from './prompts';
import { parseAiReportEnhancement, type AiReportEnhancement } from './schemas';

let engine: MLCEngineInterface | null = null;
let engineWorker: Worker | null = null;
let loadedModelId: string | null = null;
let cancelRequested = false;
let generationCancelRequested = false;

export const AI_GENERATION_TIMEOUT_MS = 90_000;
export const IOS_AI_GENERATION_TIMEOUT_MS = 60_000;
export const MODEL_HEALTH_TIMEOUT_MS = 45_000;

export interface AiGenerationProgress {
  phase: 'preparing' | 'generating' | 'validating';
  message: string;
  generatedCharacters: number;
}

interface GenerationProfile {
  id: 'mobile-fast' | 'balanced';
  maxTokens: number;
  firstTokenTimeoutMs: number;
  inactivityTimeoutMs: number;
  totalTimeoutMs: number;
}

function isAppleMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function getGenerationProfile(appleMobile = isAppleMobile()): GenerationProfile {
  return appleMobile
    ? { id: 'mobile-fast', maxTokens: 140, firstTokenTimeoutMs: 25_000, inactivityTimeoutMs: 15_000, totalTimeoutMs: IOS_AI_GENERATION_TIMEOUT_MS }
    : { id: 'balanced', maxTokens: 180, firstTokenTimeoutMs: 35_000, inactivityTimeoutMs: 20_000, totalTimeoutMs: AI_GENERATION_TIMEOUT_MS };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

async function interruptEngine(forceReset: boolean): Promise<void> {
  const activeEngine = engine;
  if (!activeEngine) return;
  const interrupted = await Promise.race([
    Promise.resolve().then(() => activeEngine.interruptGenerate()).then(() => true).catch(() => false),
    wait(1_500).then(() => false),
  ]);
  if (forceReset || !interrupted) {
    engineWorker?.terminate();
    engineWorker = null;
    engine = null;
    loadedModelId = null;
  }
}

export async function nextWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof globalThis.setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = globalThis.setTimeout(() => reject(new Error('AI_STREAM_TIMEOUT')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) globalThis.clearTimeout(timer);
  }
}

export async function detectWebGPU(): Promise<{ supported: boolean; reason: string }> {
  if (!navigator.gpu) return { supported: false, reason: '此瀏覽器未提供 WebGPU。你仍可完整使用輕量模式。' };
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter ? { supported: true, reason: '偵測到 WebGPU，可由你主動下載並啟用本地模型。' } : { supported: false, reason: '找不到可用的 WebGPU 顯示卡介面。' };
  } catch {
    return { supported: false, reason: 'WebGPU 偵測失敗，請更新瀏覽器或改用輕量模式。' };
  }
}

export function buildModelHealthCheckRequest(): ChatCompletionRequestNonStreaming {
  return {
    stream: false,
    messages: [{ role: 'user', content: '只回答兩個字：就緒' }],
    temperature: 0,
    max_tokens: 8,
  };
}

async function verifyLoadedModelResponse(activeEngine: MLCEngineInterface): Promise<void> {
  const response = await nextWithTimeout(
    activeEngine.chat.completions.create(buildModelHealthCheckRequest()),
    MODEL_HEALTH_TIMEOUT_MS,
  );
  const content = response.choices[0]?.message.content?.trim();
  if (!content) throw new Error('MODEL_HEALTH_EMPTY');
}

export async function loadLocalModel(modelId: string, onProgress: (progress: number, message: string) => void): Promise<void> {
  const support = await detectWebGPU();
  if (!support.supported) throw new Error(support.reason);
  cancelRequested = false;
  let nextWorker: Worker | null = null;
  try {
    const webllm = await import('@mlc-ai/web-llm');
    nextWorker = new Worker(new URL('./webllm-worker.ts', import.meta.url), { type: 'module' });
    engineWorker = nextWorker;
    engine = await webllm.CreateWebWorkerMLCEngine(nextWorker, modelId, {
      initProgressCallback: (report) => {
        if (cancelRequested) throw new Error('MODEL_LOAD_CANCELLED');
        onProgress(Math.round(report.progress * 100), report.text || '正在載入本地模型…');
      },
      logLevel: 'WARN',
    });
    if (cancelRequested) { await engine.unload(); engine = null; nextWorker.terminate(); engineWorker = null; throw new Error('MODEL_LOAD_CANCELLED'); }
    onProgress(99, '模型已下載，正在進行短回應自我測試…');
    await verifyLoadedModelResponse(engine);
    loadedModelId = modelId;
    onProgress(100, '模型已通過回應測試。');
  } catch (reason) {
    nextWorker?.terminate();
    if (engineWorker === nextWorker) engineWorker = null;
    engine = null;
    loadedModelId = null;
    if (cancelRequested || (reason instanceof Error && reason.message.includes('MODEL_LOAD_CANCELLED'))) throw new Error('已取消模型載入，網站維持輕量模式。');
    if (reason instanceof Error && (reason.message.includes('AI_STREAM_TIMEOUT') || reason.message.includes('MODEL_HEALTH_EMPTY'))) {
      throw new Error('AI-L02：模型下載完成但無法通過短回應測試，已停止 Worker。請關閉其他分頁後重試；若仍失敗，請繼續使用完整輕量報告。');
    }
    throw new Error('本地模型載入失敗，已切回輕量模式。請確認裝置記憶體與網路後再試。');
  }
}

export function cancelModelLoad(): void { cancelRequested = true; engineWorker?.terminate(); engineWorker = null; engine = null; loadedModelId = null; }
export function isModelReady(): boolean { return engine !== null; }
export async function cancelAiGeneration(): Promise<void> {
  generationCancelRequested = true;
  await interruptEngine(true);
}

export async function clearModelCache(modelId: string): Promise<void> {
  if (engine) { await engine.unload(); engine = null; }
  engineWorker?.terminate(); engineWorker = null;
  loadedModelId = null;
  const { deleteModelAllInfoInCache } = await import('@mlc-ai/web-llm');
  await Promise.all([
    deleteModelAllInfoInCache(modelId),
    // Remove the previous default as well so a failed iOS experiment does not
    // keep hundreds of megabytes after the user chooses "clear model cache".
    ...(modelId === 'Qwen3-0.6B-q4f16_1-MLC' ? [] : [deleteModelAllInfoInCache('Qwen3-0.6B-q4f16_1-MLC')]),
  ]);
}

const AI_ENHANCEMENT_JSON_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    summary: { type: 'string', minLength: 20, maxLength: 90 },
    suggestions: { type: 'array', minItems: 2, maxItems: 2, items: { type: 'string', minLength: 8, maxLength: 40 } },
  },
  required: ['summary', 'suggestions'],
  additionalProperties: false,
});

export function buildAiCompletionRequest(
  input: FateReportInput,
  appleMobile = isAppleMobile(),
  modelId = loadedModelId ?? DEFAULT_LOCAL_MODEL_ID,
): ChatCompletionRequestStreaming {
  const profile = getGenerationProfile(appleMobile);
  return {
    stream: true,
    stream_options: { include_usage: true },
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: buildFastReportUserPrompt(input) }],
    temperature: 0.2,
    max_tokens: profile.maxTokens,
    response_format: { type: 'json_object', schema: AI_ENHANCEMENT_JSON_SCHEMA },
    // Kept for users with an older cached Qwen3 model. Qwen2.5 does not have
    // a thinking stage and therefore receives no model-specific extra field.
    ...(modelId.startsWith('Qwen3-') ? { extra_body: { enable_thinking: false } } : {}),
  };
}

export function attachAiEnhancement(
  fallback: AiFateReport,
  enhancement: AiReportEnhancement,
  modelId: string,
  generatedAt = new Date().toISOString(),
): AiFateReport {
  return {
    ...fallback,
    mode: 'ai',
    aiEnhancement: {
      summary: enhancement.summary,
      suggestions: enhancement.suggestions,
      modelId,
      generatedAt,
    },
  };
}

export async function generateAiReport(
  input: FateReportInput,
  onProgress: (progress: AiGenerationProgress) => void = () => undefined,
): Promise<AiFateReport> {
  if (!engine) throw new Error('本地模型尚未載入。請先到設定頁主動啟用智慧模式。');
  generationCancelRequested = false;
  const profile = getGenerationProfile();
  const startedAt = Date.now();
  let receivedFirstToken = false;

  try {
    onProgress({ phase: 'preparing', message: profile.id === 'mobile-fast' ? '正在啟動手機快速模式…' : '正在整理結構化資料…', generatedCharacters: 0 });
    const chunks = await nextWithTimeout(
      engine.chat.completions.create(buildAiCompletionRequest(input)),
      Math.min(20_000, profile.firstTokenTimeoutMs),
    );
    const iterator = chunks[Symbol.asyncIterator]();
    let content = '';
    let lastUpdateAt = 0;

    while (true) {
      if (generationCancelRequested) throw new Error('AI_GENERATION_CANCELLED');
      const elapsed = Date.now() - startedAt;
      const remaining = profile.totalTimeoutMs - elapsed;
      if (remaining <= 0) throw new Error('AI_GENERATION_TIMEOUT');
      const chunkTimeout = receivedFirstToken ? profile.inactivityTimeoutMs : profile.firstTokenTimeoutMs;
      const next = await nextWithTimeout(iterator.next(), Math.min(chunkTimeout, remaining));
      if (next.done) break;
      const chunk = next.value;
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (!delta) continue;
      receivedFirstToken = true;
      content += delta;
      const now = Date.now();
      if (now - lastUpdateAt >= 200) {
        lastUpdateAt = now;
        onProgress({
          phase: 'generating',
          message: `正在生成報告，已收到 ${content.length} 個字元…`,
          generatedCharacters: content.length,
        });
      }
    }

    if (generationCancelRequested) throw new Error('AI_GENERATION_CANCELLED');
    if (!content.trim()) throw new Error('EMPTY_RESPONSE');
    onProgress({ phase: 'validating', message: '正在驗證報告格式…', generatedCharacters: content.length });
    const enhancement = parseAiReportEnhancement(content);
    const fallback = generateFallbackReport(input);
    // Keep deterministic content unchanged. AI text is stored separately so
    // the UI can show exactly which words came from the local model.
    return attachAiEnhancement(fallback, enhancement, loadedModelId ?? DEFAULT_LOCAL_MODEL_ID);
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : '';
    if (message.includes('AI_GENERATION_TIMEOUT') || message.includes('AI_STREAM_TIMEOUT')) {
      await interruptEngine(true);
      const elapsedSeconds = Math.max(1, Math.ceil((Date.now() - startedAt) / 1_000));
      throw new Error(`AI-G01：本地 AI 在 ${elapsedSeconds} 秒內未能持續回應，已強制停止並保留完整模板報告。若要重試，請回設定重新啟用模型。`);
    }
    if (generationCancelRequested || (reason instanceof Error && reason.message.includes('AI_GENERATION_CANCELLED'))) {
      throw new Error('已停止本地 AI 生成，並保留原本的規則模板報告。');
    }
    if (reason instanceof Error && reason.message.includes('格式無法驗證')) {
      throw new Error('AI-G03：模型有回應，但 JSON 格式不完整；已保留完整模板報告。');
    }
    if (message.includes('EMPTY_RESPONSE')) throw new Error('AI-G02：模型完成生成但沒有文字內容；已保留完整模板報告。');
    throw new Error('AI-G04：本地 AI 產生報告時發生錯誤，已保留完整模板報告。');
  }
}
