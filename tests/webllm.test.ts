import { describe, expect, it } from 'vitest';
import { AI_GENERATION_TIMEOUT_MS, attachAiEnhancement, buildAiCompletionRequest, buildModelHealthCheckRequest, getGenerationProfile, IOS_AI_GENERATION_TIMEOUT_MS, nextWithTimeout } from '../src/ai/webllm';
import { generateFallbackReport } from '../src/ai/fallback-report';
import { calculateSunSign } from '../src/engines/astrology-engine';
import { calculateBazi } from '../src/engines/bazi-engine';
import { calculateFiveElements } from '../src/engines/five-elements-engine';
import { calculateNumerology } from '../src/engines/numerology-engine';
import { getZodiacResult } from '../src/engines/zodiac-engine';

const bazi = calculateBazi({ birthDate: '1990-01-02', birthTime: '10:30', timezone: 'Asia/Taipei' });
const reportInput = { userFocus: ['career'], bazi, fiveElements: calculateFiveElements(bazi.pillars), zodiac: getZodiacResult(bazi.zodiac), astrology: calculateSunSign('1990-01-02'), numerology: calculateNumerology('1990-01-02') };

describe('WebLLM 生成設定', () => {
  it('Qwen2.5 串流不使用 response_format 文法約束（避免 XGrammar 讓 WebGPU 崩潰），也不帶思考參數', () => {
    const request = buildAiCompletionRequest(reportInput, false);

    expect(request.stream).toBe(true);
    expect(request.stream_options).toEqual({ include_usage: true });
    expect(request.extra_body).toBeUndefined();
    // 不再夾帶 JSON schema：靠提示詞產出 JSON、解析端優雅退回，杜絕硬崩潰。
    expect(request.response_format).toBeUndefined();
    expect(request.max_tokens).toBeLessThanOrEqual(180);
    expect(request.messages[1]?.content).toContain('相對突出五行');
    expect(request.messages[1]?.content).toContain('兩項建議不可重複摘要');
  });

  it('舊 Qwen3 模型仍會明確關閉思考模式', () => {
    const request = buildAiCompletionRequest(reportInput, false, 'Qwen3-0.6B-q4f16_1-MLC');
    expect(request.extra_body).toMatchObject({ enable_thinking: false });
  });

  it('iPhone 使用更短輸出與可強制結束的 60 秒上限', () => {
    const mobileRequest = buildAiCompletionRequest(reportInput, true);
    const mobileProfile = getGenerationProfile(true);

    expect(mobileRequest.max_tokens).toBe(140);
    expect(mobileProfile.totalTimeoutMs).toBe(IOS_AI_GENERATION_TIMEOUT_MS);
    expect(IOS_AI_GENERATION_TIMEOUT_MS).toBe(60_000);
    expect(AI_GENERATION_TIMEOUT_MS).toBe(90_000);
  });

  it('模型載入完成後用極短非 JSON 請求驗證真實回應', () => {
    const request = buildModelHealthCheckRequest();
    expect(request.stream).toBe(false);
    expect(request.response_format).toBeUndefined();
    expect(request.max_tokens).toBe(8);
  });

  it('AI 原文獨立保存，不覆寫規則摘要或混入規則建議', () => {
    const fallback = generateFallbackReport(reportInput);
    const result = attachAiEnhancement(
      fallback,
      { summary: '這是模型原文摘要', suggestions: ['模型建議一', '模型建議二'] },
      'test-model',
      '2026-07-22T00:00:00.000Z',
    );

    expect(result.summary).toBe(fallback.summary);
    expect(result.focusAnalysis).toEqual(fallback.focusAnalysis);
    expect(result.aiEnhancement).toEqual({
      summary: '這是模型原文摘要',
      suggestions: ['模型建議一', '模型建議二'],
      modelId: 'test-model',
      generatedAt: '2026-07-22T00:00:00.000Z',
    });
  });

  it('Worker 沒有回應時 deadline 會拒絕而不是永遠等待', async () => {
    const never = new Promise<void>(() => undefined);
    await expect(nextWithTimeout(never, 5)).rejects.toThrow('AI_STREAM_TIMEOUT');
  });
});
