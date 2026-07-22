import { describe, expect, it } from 'vitest';
import { AI_GENERATION_TIMEOUT_MS, buildAiCompletionRequest, getGenerationProfile, IOS_AI_GENERATION_TIMEOUT_MS, nextWithTimeout } from '../src/ai/webllm';
import { calculateSunSign } from '../src/engines/astrology-engine';
import { calculateBazi } from '../src/engines/bazi-engine';
import { calculateFiveElements } from '../src/engines/five-elements-engine';
import { calculateNumerology } from '../src/engines/numerology-engine';
import { getZodiacResult } from '../src/engines/zodiac-engine';

const bazi = calculateBazi({ birthDate: '1990-01-02', birthTime: '10:30', timezone: 'Asia/Taipei' });
const reportInput = { userFocus: ['career'], bazi, fiveElements: calculateFiveElements(bazi.pillars), zodiac: getZodiacResult(bazi.zodiac), astrology: calculateSunSign('1990-01-02'), numerology: calculateNumerology('1990-01-02') };

describe('WebLLM 生成設定', () => {
  it('關閉 Qwen3 思考模式並使用串流回傳', () => {
    const request = buildAiCompletionRequest(reportInput, false);

    expect(request.stream).toBe(true);
    expect(request.stream_options).toEqual({ include_usage: true });
    expect(request.extra_body).toMatchObject({ enable_thinking: false });
    expect(request.max_tokens).toBeLessThanOrEqual(320);
  });

  it('iPhone 使用更短輸出與可強制結束的 90 秒上限', () => {
    const mobileRequest = buildAiCompletionRequest(reportInput, true);
    const mobileProfile = getGenerationProfile(true);

    expect(mobileRequest.max_tokens).toBe(220);
    expect(mobileProfile.totalTimeoutMs).toBe(IOS_AI_GENERATION_TIMEOUT_MS);
    expect(IOS_AI_GENERATION_TIMEOUT_MS).toBe(90_000);
    expect(AI_GENERATION_TIMEOUT_MS).toBe(150_000);
  });

  it('Worker 沒有回應時 deadline 會拒絕而不是永遠等待', async () => {
    const never = new Promise<void>(() => undefined);
    await expect(nextWithTimeout(never, 5)).rejects.toThrow('AI_STREAM_TIMEOUT');
  });
});
