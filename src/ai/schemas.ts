import { z } from 'zod';
import type { AiFateReport } from '../types/fate';

export const aiFateReportSchema = z.object({
  summary: z.string().min(1),
  sharedPatterns: z.array(z.string()).min(1),
  differences: z.array(z.string()),
  sections: z.object({
    bazi: z.string(), zodiac: z.string(), astrology: z.string(), ziwei: z.string().optional(), numerology: z.string(), name: z.string().optional(),
  }),
  focusAnalysis: z.array(z.object({ topic: z.string(), analysis: z.string(), suggestions: z.array(z.string()) })),
  cautions: z.array(z.string()),
});

export const aiReportEnhancementSchema = z.object({
  summary: z.string().min(1).max(180),
  suggestions: z.array(z.string().min(1).max(80)).length(2),
});

export type AiReportEnhancement = z.infer<typeof aiReportEnhancementSchema>;

export function parseAiReport(raw: string): AiFateReport {
  try {
    const withoutFence = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    return { ...aiFateReportSchema.parse(JSON.parse(withoutFence)), mode: 'ai' };
  } catch {
    throw new Error('本地 AI 回傳格式無法驗證，已切換為輕量模式。');
  }
}

export function parseAiReportEnhancement(raw: string): AiReportEnhancement {
  try {
    const withoutFence = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    return aiReportEnhancementSchema.parse(JSON.parse(withoutFence));
  } catch {
    throw new Error('本地 AI 回傳格式無法驗證，已切換為輕量模式。');
  }
}
