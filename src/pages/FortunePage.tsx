import { AlertCircle, Check, Crop, FileImage, RefreshCw, RotateCw, ScanLine, Trash2, X } from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import type { LoggerMessage, Worker } from 'tesseract.js';
import Disclaimer from '../components/common/Disclaimer';
import { loadFortuneSticks, matchFortuneSticks, type FortuneMatch } from '../engines/fortune-stick-matcher';
import { applyImageMode, centerCropCanvas, prepareImage, rotateCanvas, type ImageMode, type PreparedImage } from '../engines/image-preprocessor';
import { useFateStore } from '../store/useFateStore';
import type { FortuneStick, FortuneTopic } from '../types/fate';
import { TOPIC_LABELS } from '../utils/constants';

type FortuneSystem = 'sixty-jiazi' | 'guanyin-100' | 'custom';
type OcrState = 'idle' | 'initializing' | 'loading' | 'recognizing' | 'done' | 'error' | 'cancelled';

const systems: { value: FortuneSystem; label: string; note: string }[] = [
  { value: 'sixty-jiazi', label: '六十甲子籤', note: '目前為 3 筆自編示範' },
  { value: 'guanyin-100', label: '觀音一百籤', note: '目前為 3 筆格式示範' },
  { value: 'custom', label: '其他／不確定', note: '搜尋全部示範資料' },
];
const topics: FortuneTopic[] = ['overall', 'career', 'jobChange', 'love', 'wealth', 'family', 'health', 'study', 'travel', 'custom'];
const imageModes: { value: ImageMode; label: string }[] = [{ value: 'original', label: '原圖' }, { value: 'grayscale', label: '灰階' }, { value: 'contrast', label: '高對比' }, { value: 'binary', label: '黑白二值化' }];

function release(url?: string) { if (url) URL.revokeObjectURL(url); }

export default function FortunePage() {
  const [system, setSystem] = useState<FortuneSystem>('sixty-jiazi');
  const [preview, setPreview] = useState<PreparedImage>();
  const [mode, setMode] = useState<ImageMode>('original');
  const [ocrState, setOcrState] = useState<OcrState>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('尚未開始辨識');
  const [error, setError] = useState('');
  const [matches, setMatches] = useState<FortuneMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const originalCanvas = useRef<HTMLCanvasElement | undefined>(undefined);
  const workerRef = useRef<Worker | null>(null);
  const ocrText = useFateStore((state) => state.ocrText);
  const setOcrText = useFateStore((state) => state.setOcrText);
  const selected = useFateStore((state) => state.selectedFortune);
  const selectFortune = useFateStore((state) => state.selectFortune);
  const topic = useFateStore((state) => state.fortuneTopic);
  const setTopic = useFateStore((state) => state.setFortuneTopic);
  const customQuestion = useFateStore((state) => state.customQuestion);
  const setCustomQuestion = useFateStore((state) => state.setCustomQuestion);

  useEffect(() => () => { release(preview?.objectUrl); void workerRef.current?.terminate(); }, [preview?.objectUrl]);

  const replacePreview = (next: PreparedImage) => {
    release(preview?.objectUrl);
    setPreview(next);
  };

  const chooseImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(''); setMatches([]); selectFortune(undefined);
    try {
      const prepared = await prepareImage(file);
      originalCanvas.current = prepared.canvas;
      replacePreview(prepared);
      setMode('original');
      setOcrState('idle');
      setStatusMessage(`已縮放為 ${prepared.width} × ${prepared.height} px，可開始辨識。`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : '圖片載入失敗，請改用其他檔案。'); }
    event.target.value = '';
  };

  const changeMode = async (nextMode: ImageMode) => {
    if (!originalCanvas.current) return;
    setError('');
    try { const next = await applyImageMode(originalCanvas.current, nextMode); replacePreview(next); setMode(nextMode); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '圖片處理失敗。'); }
  };

  const rotate = async () => {
    if (!preview) return;
    try { const next = await rotateCanvas(preview.canvas); originalCanvas.current = next.canvas; replacePreview(next); setMode('original'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '圖片旋轉失敗。'); }
  };

  const crop = async () => {
    if (!preview) return;
    try { const next = await centerCropCanvas(preview.canvas); originalCanvas.current = next.canvas; replacePreview(next); setMode('original'); setStatusMessage('已裁去四周各 5%，可重複操作或重新選圖。'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '圖片裁切失敗。'); }
  };

  const clearImage = async () => {
    release(preview?.objectUrl); setPreview(undefined); originalCanvas.current = undefined; setMode('original'); setProgress(0); setOcrState('idle'); setStatusMessage('尚未開始辨識');
    if (workerRef.current) { await workerRef.current.terminate(); workerRef.current = null; }
  };

  const runOcr = async () => {
    if (!preview || workerRef.current) return;
    setError(''); setProgress(0); setOcrState('initializing'); setStatusMessage('正在初始化 OCR…');
    try {
      const tesseract = await import('tesseract.js');
      const worker = await tesseract.createWorker('chi_tra', tesseract.OEM.LSTM_ONLY, {
        logger: (message: LoggerMessage) => {
          if (message.status.includes('loading')) { setOcrState('loading'); setStatusMessage('正在下載或載入繁體中文語言資料…'); }
          else if (message.status.includes('recognizing')) { setOcrState('recognizing'); setStatusMessage('正在辨識籤詩文字…'); }
          if (typeof message.progress === 'number') setProgress(Math.round(message.progress * 100));
        },
      });
      workerRef.current = worker;
      const result = await worker.recognize(preview.canvas);
      setOcrText(result.data.text.trim());
      setOcrState('done'); setProgress(100); setStatusMessage('辨識完成。請先校對文字，再進行籤詩比對。');
      await worker.terminate(); workerRef.current = null;
    } catch (reason) {
      workerRef.current = null; setOcrState('error'); setError('OCR 辨識失敗。請確認網路後重試，或直接手動輸入籤文。'); setStatusMessage(reason instanceof Error ? reason.message : '辨識程序無法完成。');
    }
  };

  const cancelOcr = async () => {
    await workerRef.current?.terminate(); workerRef.current = null; setOcrState('cancelled'); setStatusMessage('已取消 OCR。你可以重新開始或手動輸入。'); setProgress(0);
  };

  const search = async () => {
    if (!ocrText.trim() || loadingMatches) { if (!ocrText.trim()) setError('請先輸入或辨識籤號、標題或籤文。'); return; }
    setLoadingMatches(true); setError(''); selectFortune(undefined);
    try {
      const sticks = await loadFortuneSticks(system);
      const next = matchFortuneSticks(ocrText, sticks);
      setMatches(next);
      if (!next.length) setError('找不到相似籤詩。可修改辨識文字、只輸入籤號，或切換「其他／不確定」再搜尋。');
    } catch (reason) { setError(reason instanceof Error ? reason.message : '籤詩資料載入失敗。'); }
    finally { setLoadingMatches(false); }
  };

  const topicInterpretation = (stick: FortuneStick) => topic === 'custom' ? `${stick.interpretations.overall} 針對「${customQuestion || '你的問題'}」，建議先把問題拆成可觀察的事實與下一個小步驟。` : stick.interpretations[topic] ?? stick.interpretations.overall;

  return (
    <section className="page-container page-section">
      <div className="max-w-3xl"><p className="eyebrow">Fortune Lens</p><h1 className="display-title mt-3">拍籤解籤</h1><p className="mt-5 muted">圖片先在瀏覽器縮小與處理，OCR 文字由你確認後，才與內建示範籤詩進行模糊比對。</p></div>
      <div className="mt-8 grid gap-7 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-6">
          <article className="glass-card p-5 sm:p-6"><span className="eyebrow">01 籤詩來源</span><div className="mt-4 space-y-2">{systems.map((item) => <label key={item.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${system === item.value ? 'border-gold/60 bg-gold/10' : 'border-white/10 bg-white/[0.03]'}`}><input type="radio" name="system" value={item.value} checked={system === item.value} onChange={() => { setSystem(item.value); setMatches([]); selectFortune(undefined); }} /><span><strong className="block text-cream">{item.label}</strong><span className="text-xs text-mist">{item.note}</span></span></label>)}</div></article>
          <article className="glass-card p-5 sm:p-6"><span className="eyebrow">02 上傳與預處理</span><label className="btn-secondary mt-4 w-full cursor-pointer"><FileImage size={18} />選擇籤詩照片<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} /></label><p className="mt-2 text-xs leading-5 text-mist">支援 JPG、PNG、WebP，最大 15 MB；最長邊會自動縮至 1800 px。</p>
            {preview && <><div className="mt-4 overflow-auto rounded-xl border border-white/10 bg-black/20 p-2"><img className="mx-auto max-h-[52vh] max-w-full rounded-lg object-contain" src={preview.objectUrl} alt="待辨識籤詩預覽" /></div><div className="mt-3 flex flex-wrap gap-2">{imageModes.map((item) => <button className={`chip ${mode === item.value ? 'chip-active' : ''}`} type="button" key={item.value} onClick={() => void changeMode(item.value)}>{item.label}</button>)}<button className="chip" type="button" onClick={() => void rotate()}><RotateCw size={15} />旋轉 90°</button><button className="chip" type="button" onClick={() => void crop()}><Crop size={15} />重新裁切</button><button className="chip" type="button" onClick={() => void clearImage()}><Trash2 size={15} />清除</button></div></>}
          </article>
        </div>

        <div className="space-y-6">
          <article className="glass-card p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><span className="eyebrow">03 OCR 與文字校對</span>{['initializing','loading','recognizing'].includes(ocrState) && <button className="text-sm text-mist hover:text-cream" type="button" onClick={() => void cancelOcr()}><X className="inline" size={16} /> 取消</button>}</div><div className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-mist" role="status"><div className="flex justify-between gap-3"><span>{statusMessage}</span><span>{progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div></div><button className="btn-primary mt-4 w-full" type="button" onClick={() => void runOcr()} disabled={!preview || ['initializing','loading','recognizing'].includes(ocrState)}><ScanLine size={18} />{ocrState === 'done' ? '重新 OCR 辨識' : '開始 OCR 辨識'}</button><label className="mt-5 block"><span className="label">辨識文字（可手動修正）</span><textarea className="input-field min-h-40 resize-y" value={ocrText} onChange={(e) => setOcrText(e.target.value)} placeholder="也可以直接輸入籤號、標題，或至少前兩句籤文。" /></label><button className="btn-secondary mt-3 w-full" type="button" disabled={loadingMatches} onClick={() => void search()}>{loadingMatches ? '正在比對…' : '比對示範籤詩'}</button></article>
          {error && <div className="flex items-start gap-3 rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-100" role="alert"><AlertCircle className="mt-0.5 shrink-0" size={18} />{error}</div>}
          {matches.length > 0 && <article className="glass-card p-5 sm:p-6"><span className="eyebrow">04 候選籤詩</span><div className="mt-4 space-y-3">{matches.map(({ item, confidence }) => <div key={item.id} className={`rounded-2xl border p-4 ${selected?.id === item.id ? 'border-gold/60 bg-gold/[0.08]' : 'border-white/10 bg-white/[0.025]'}`}><div className="flex items-start justify-between gap-3"><div><span className="text-xs text-gold">第 {item.number} 籤 · {item.level}</span><h3 className="mt-1 font-serif text-lg font-semibold">{item.title}</h3></div><span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-mist">符合度 {Math.round(confidence * 100)}%</span></div><p className="mt-3 text-sm leading-6 text-mist">{item.poem.join('　')}</p><button className="btn-secondary mt-3 w-full" type="button" onClick={() => selectFortune(item)}>{selected?.id === item.id ? <><Check size={17} />已選擇</> : '選擇這支籤'}</button></div>)}</div></article>}
        </div>
      </div>

      {selected && <article className="glass-card mt-8 overflow-hidden"><div className="border-b border-white/10 p-6 sm:p-8"><span className="eyebrow">05 確認主題與解籤</span><div className="mt-5 flex flex-wrap gap-2">{topics.map((item) => <button className={`chip ${topic === item ? 'chip-active' : ''}`} type="button" onClick={() => setTopic(item)} key={item}>{TOPIC_LABELS[item]}</button>)}</div>{topic === 'custom' && <label className="mt-4 block max-w-2xl"><span className="label">想問的問題</span><textarea className="input-field min-h-24" value={customQuestion} onChange={(e) => setCustomQuestion(e.target.value)} placeholder="請避免輸入可識別他人的敏感資料。" /></label>}</div>
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.72fr_1fr]"><div><span className="text-sm text-gold">{selected.sourceName}</span><h2 className="mt-2 font-serif text-3xl font-semibold">第 {selected.number} 籤 · {selected.title}</h2><span className="mt-3 inline-block rounded-full border border-gold/30 px-3 py-1 text-sm text-gold">{selected.level}</span><blockquote className="mt-6 space-y-2 border-l border-gold/40 pl-5 font-serif text-lg leading-8 text-cream">{selected.poem.map((line) => <p key={line}>{line}</p>)}</blockquote></div><div className="space-y-5"><section><h3 className="font-semibold text-gold">傳統籤意／資料原文</h3><p className="mt-2 leading-7 text-mist">此筆為自編示範籤，沒有冒用傳統籤意。原始籤文如左，資料中的典故說明為：{selected.story ?? '未提供典故。'}</p></section><section><h3 className="font-semibold text-gold">現代化整理</h3><p className="mt-2 leading-7 text-mist">白話解釋：{selected.summary}</p><p className="mt-2 leading-7 text-mist">你詢問的主題：{TOPIC_LABELS[topic]}。{topicInterpretation(selected)}</p></section><section><h3 className="font-semibold text-gold">可採取的行動</h3><ul className="mt-2 space-y-2 text-mist">{selected.actions.map((item) => <li key={item}>• {item}</li>)}</ul></section><section><h3 className="font-semibold text-gold">需要留意的風險</h3><ul className="mt-2 space-y-2 text-mist">{selected.risks.map((item) => <li key={item}>• {item}</li>)}</ul></section><section className="rounded-xl bg-white/5 p-4 text-xs leading-5 text-mist"><strong className="text-cream">原始資料來源：</strong>{selected.dataSource.sourceName} · {selected.dataSource.license ?? '未標示授權'}<br />{selected.dataSource.notes}<br /><strong className="text-cream">解讀模式：</strong>規則模板解讀</section></div></div>
        {topic === 'health' && <div className="px-6 pb-6 sm:px-8"><Disclaimer health /></div>}
      </article>}
      <div className="mt-8"><Disclaimer /></div>
      {ocrState === 'error' && <button className="btn-secondary mt-4" type="button" onClick={() => { setOcrState('idle'); setError(''); }}><RefreshCw size={17} />重試辨識</button>}
    </section>
  );
}
