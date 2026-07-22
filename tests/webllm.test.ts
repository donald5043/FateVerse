import { describe, expect, it } from 'vitest';
import { AI_GENERATION_TIMEOUT_MS, buildAiCompletionRequest } from '../src/ai/webllm';
import type { FateReportInput } from '../src/types/fate';

describe('WebLLM 生成設定', () => {
  it('關閉 Qwen3 思考模式並使用串流回傳', () => {
    const request = buildAiCompletionRequest({} as FateReportInput);

    expect(request.stream).toBe(true);
    expect(request.stream_options).toEqual({ include_usage: true });
    expect(request.extra_body).toMatchObject({ enable_thinking: false });
    expect(request.max_tokens).toBeLessThanOrEqual(900);
  });

  it('提供有限的生成逾時', () => {
    expect(AI_GENERATION_TIMEOUT_MS).toBe(180_000);
  });
});
