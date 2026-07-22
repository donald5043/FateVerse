import { CreateMLCEngine, CreateWebWorkerMLCEngine, prebuiltAppConfig } from '@mlc-ai/web-llm';

if (typeof CreateMLCEngine !== 'function' || typeof CreateWebWorkerMLCEngine !== 'function') {
  throw new Error('WebLLM engine factory API 不符合目前整合預期。');
}

const requiredModel = 'Qwen3-0.6B-q4f16_1-MLC';
if (!prebuiltAppConfig.model_list.some((model) => model.model_id === requiredModel)) {
  throw new Error(`WebLLM 預建模型清單找不到 ${requiredModel}。`);
}

console.log(`WebLLM API OK：找到 ${requiredModel}；此驗證不下載模型。`);
