import type { MLCEngine } from '@mlc-ai/web-llm';
import type { AiFateReport, FateReportInput, LocalModelOption } from '../types/fate';
import { buildReportUserPrompt, SYSTEM_PROMPT } from './prompts';
import { parseAiReport } from './schemas';

export const LOCAL_MODELS: LocalModelOption[] = [{
  id: 'Qwen3-0.6B-q4f16_1-MLC',
  name: 'Qwen3 0.6B（WebLLM）',
  approximateSize: '約 650 MB（依瀏覽器快取與版本而異）',
  recommendedMemory: '建議至少 4 GB 系統記憶體、約 1.5 GB 可用 GPU 記憶體',
  description: 'WebLLM 預建清單中的小型中文模型，適合短篇結構化整理；輸出品質仍可能不穩定。',
}];

let engine: MLCEngine | null = null;
let cancelRequested = false;

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
  try {
    const webllm = await import('@mlc-ai/web-llm');
    engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback: (report) => {
        if (cancelRequested) throw new Error('MODEL_LOAD_CANCELLED');
        onProgress(Math.round(report.progress * 100), report.text || '正在載入本地模型…');
      },
      logLevel: 'WARN',
    });
    if (cancelRequested) { await engine.unload(); engine = null; throw new Error('MODEL_LOAD_CANCELLED'); }
  } catch (reason) {
    engine = null;
    if (reason instanceof Error && reason.message.includes('MODEL_LOAD_CANCELLED')) throw new Error('已取消模型載入，網站維持輕量模式。');
    throw new Error('本地模型載入失敗，已切回輕量模式。請確認裝置記憶體與網路後再試。');
  }
}

export function cancelModelLoad(): void { cancelRequested = true; }
export function isModelReady(): boolean { return engine !== null; }

export async function clearModelCache(modelId: string): Promise<void> {
  if (engine) { await engine.unload(); engine = null; }
  const { deleteModelAllInfoInCache } = await import('@mlc-ai/web-llm');
  await deleteModelAllInfoInCache(modelId);
}

export async function generateAiReport(input: FateReportInput): Promise<AiFateReport> {
  if (!engine) throw new Error('本地模型尚未載入。請先到設定頁主動啟用智慧模式。');
  try {
    const completion = await engine.chat.completions.create({
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: buildReportUserPrompt(input) }],
      temperature: 0.25,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });
    const content = completion.choices[0]?.message.content;
    if (typeof content !== 'string') throw new Error('EMPTY_RESPONSE');
    return parseAiReport(content);
  } catch (reason) {
    if (reason instanceof Error && reason.message.includes('格式無法驗證')) throw reason;
    throw new Error('本地 AI 產生報告時發生錯誤，已保留原本的規則模板報告。');
  }
}
