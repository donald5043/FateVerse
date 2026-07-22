import type { ChatCompletionRequestStreaming, MLCEngineInterface } from '@mlc-ai/web-llm';
import type { AiFateReport, FateReportInput } from '../types/fate';
import { buildReportUserPrompt, SYSTEM_PROMPT } from './prompts';
import { parseAiReport } from './schemas';

let engine: MLCEngineInterface | null = null;
let engineWorker: Worker | null = null;
let cancelRequested = false;
let generationCancelRequested = false;

export const AI_GENERATION_TIMEOUT_MS = 180_000;

export interface AiGenerationProgress {
  phase: 'preparing' | 'generating' | 'validating';
  message: string;
  generatedCharacters: number;
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
  } catch (reason) {
    nextWorker?.terminate();
    if (engineWorker === nextWorker) engineWorker = null;
    engine = null;
    if (cancelRequested || (reason instanceof Error && reason.message.includes('MODEL_LOAD_CANCELLED'))) throw new Error('已取消模型載入，網站維持輕量模式。');
    throw new Error('本地模型載入失敗，已切回輕量模式。請確認裝置記憶體與網路後再試。');
  }
}

export function cancelModelLoad(): void { cancelRequested = true; engineWorker?.terminate(); engineWorker = null; }
export function isModelReady(): boolean { return engine !== null; }
export async function cancelAiGeneration(): Promise<void> {
  generationCancelRequested = true;
  await engine?.interruptGenerate();
}

export async function clearModelCache(modelId: string): Promise<void> {
  if (engine) { await engine.unload(); engine = null; }
  engineWorker?.terminate(); engineWorker = null;
  const { deleteModelAllInfoInCache } = await import('@mlc-ai/web-llm');
  await deleteModelAllInfoInCache(modelId);
}

export function buildAiCompletionRequest(input: FateReportInput): ChatCompletionRequestStreaming {
  return {
    stream: true,
    stream_options: { include_usage: true },
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: buildReportUserPrompt(input) }],
    temperature: 0.2,
    max_tokens: 850,
    response_format: { type: 'json_object' },
    // Qwen3 defaults to a hidden thinking pass. It is unnecessary for this
    // structured rewrite and can make a small device appear to be frozen.
    extra_body: { enable_thinking: false },
  };
}

export async function generateAiReport(
  input: FateReportInput,
  onProgress: (progress: AiGenerationProgress) => void = () => undefined,
): Promise<AiFateReport> {
  if (!engine) throw new Error('本地模型尚未載入。請先到設定頁主動啟用智慧模式。');
  generationCancelRequested = false;
  let timedOut = false;
  const timeout = globalThis.setTimeout(() => {
    timedOut = true;
    void engine?.interruptGenerate();
  }, AI_GENERATION_TIMEOUT_MS);

  try {
    onProgress({ phase: 'preparing', message: '正在整理結構化資料…', generatedCharacters: 0 });
    const chunks = await engine.chat.completions.create(buildAiCompletionRequest(input));
    let content = '';
    let lastUpdateAt = 0;

    for await (const chunk of chunks) {
      if (generationCancelRequested) throw new Error('AI_GENERATION_CANCELLED');
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (!delta) continue;
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

    if (timedOut) throw new Error('AI_GENERATION_TIMEOUT');
    if (generationCancelRequested) throw new Error('AI_GENERATION_CANCELLED');
    if (!content.trim()) throw new Error('EMPTY_RESPONSE');
    onProgress({ phase: 'validating', message: '正在驗證報告格式…', generatedCharacters: content.length });
    return parseAiReport(content);
  } catch (reason) {
    if (timedOut || (reason instanceof Error && reason.message.includes('AI_GENERATION_TIMEOUT'))) {
      throw new Error('本地 AI 生成超過 3 分鐘，已停止並保留規則模板報告。你可以稍後重試。');
    }
    if (generationCancelRequested || (reason instanceof Error && reason.message.includes('AI_GENERATION_CANCELLED'))) {
      throw new Error('已停止本地 AI 生成，並保留原本的規則模板報告。');
    }
    if (reason instanceof Error && reason.message.includes('格式無法驗證')) throw reason;
    throw new Error('本地 AI 產生報告時發生錯誤，已保留原本的規則模板報告。');
  } finally {
    globalThis.clearTimeout(timeout);
  }
}
