import type { LocalModelOption } from '../types/fate';

export const DEFAULT_LOCAL_MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';

export const LOCAL_MODELS: LocalModelOption[] = [{
  id: DEFAULT_LOCAL_MODEL_ID,
  name: 'Qwen2.5 0.5B 行動穩定版（WebLLM）',
  approximateSize: '模型檔約 276 MB，另含少量 WebGPU 執行檔與瀏覽器快取',
  recommendedMemory: 'WebLLM 標示約需 945 MB GPU 記憶體；仍建議關閉其他大型分頁',
  description: 'WebLLM 官方預建的小型中文指令模型。比原先 Qwen3 0.6B 少約三分之一 GPU 記憶體，也沒有隱藏思考階段，優先供 iPhone 與一般裝置使用。',
}];
