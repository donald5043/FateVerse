import type { LocalModelOption } from '../types/fate';

export const LOCAL_MODELS: LocalModelOption[] = [{
  id: 'Qwen3-0.6B-q4f16_1-MLC',
  name: 'Qwen3 0.6B（WebLLM）',
  approximateSize: '約 650 MB（依瀏覽器快取與版本而異）',
  recommendedMemory: '建議至少 4 GB 系統記憶體、約 1.5 GB 可用 GPU 記憶體',
  description: 'WebLLM 預建清單中的小型中文模型，適合短篇結構化整理；輸出品質仍可能不穩定。',
}];
