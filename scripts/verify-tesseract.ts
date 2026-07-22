import { createWorker, OEM, PSM } from 'tesseract.js';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { matchFortuneSticks } from '../src/engines/fortune-stick-matcher';
import type { FortuneStick } from '../src/types/fate';

if (typeof createWorker !== 'function' || OEM.LSTM_ONLY === undefined || PSM.SINGLE_BLOCK_VERT_TEXT === undefined) {
  throw new Error('Tesseract.js API 或 PSM 常數不符合目前 OCR 整合預期。');
}

const imagePath = process.env.FATEVERSE_OCR_IMAGE;
if (!imagePath) {
  console.log('Tesseract.js API OK；設定 FATEVERSE_OCR_IMAGE 可選擇執行實際 OCR（會下載語言資料）。');
} else {
  const worker = await createWorker('chi_tra_vert', OEM.LSTM_ONLY, {
    cachePath: join(tmpdir(), 'fateverse-tesseract-cache'),
  });
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK_VERT_TEXT });
    const result = await worker.recognize(imagePath);
    if (!result.data.text.trim()) throw new Error('OCR 沒有產生文字。');
    console.log(`Tesseract.js OCR OK：confidence ${Math.round(result.data.confidence)}%`);
    console.log(`OCR 文字預覽：${result.data.text.trim().replace(/\s+/g, ' ').slice(0, 240)}`);
    const fixture = JSON.parse(
      await readFile(new URL('../public/data/fortune-sticks/user-samples.json', import.meta.url), 'utf8'),
    ) as FortuneStick[];
    const [match] = matchFortuneSticks(result.data.text, fixture, 1);
    console.log(match
      ? `OCR 模糊比對：${match.item.sourceName} 第 ${match.item.number} 籤（信心 ${Math.round(match.confidence * 100)}%）`
      : 'OCR 模糊比對：沒有候選結果');
  } finally {
    await worker.terminate();
  }
}
