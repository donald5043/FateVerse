import { ArrowRight, Dice5, Download, RefreshCw, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import BackToReportLink from '../components/common/BackToReportLink';
import Disclaimer from '../components/common/Disclaimer';
import {
  buildThrowSeed, diceSideLabel, synthesizeReflection, throwFateDice,
  type FateThrow, type HopedSide, type Reaction, type RitualReflection,
} from '../engines/decision-ritual-engine';
import { useFateStore } from '../store/useFateStore';
import { clearRituals, loadRituals, saveRitual, type RitualRecord } from '../utils/storage';
import { renderRitualShareImage } from '../utils/ritual-share-image';

type Stage = 'ask' | 'hope' | 'reveal' | 'react' | 'result';

const HOPE_OPTIONS: Array<{ value: HopedSide; label: string; hint: string }> = [
  { value: 'act', label: '希望是「動」', hint: '心裡其實想往前、想改變' },
  { value: 'wait', label: '希望是「靜」', hint: '心裡其實想先等、先守' },
  { value: 'unknown', label: '真的不知道', hint: '兩邊都有拉扯，說不上來' },
];

const REACTION_OPTIONS: Array<{ value: Reaction; label: string; emoji: string }> = [
  { value: 'relief', label: '鬆了一口氣', emoji: '😮‍💨' },
  { value: 'disappoint', label: '有點失望', emoji: '😔' },
  { value: 'neutral', label: '沒什麼感覺', emoji: '😐' },
];

export default function RitualPage() {
  const reportInput = useFateStore((state) => state.reportInput);
  const [stage, setStage] = useState<Stage>('ask');
  const [question, setQuestion] = useState('');
  const [hoped, setHoped] = useState<HopedSide>();
  const [fateThrow, setFateThrow] = useState<FateThrow>();
  const [reaction, setReaction] = useState<Reaction>();
  const [reflection, setReflection] = useState<RitualReflection>();
  const [history, setHistory] = useState<RitualRecord[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [shareError, setShareError] = useState('');

  useEffect(() => { void loadRituals().then(setHistory); }, []);

  const canThrow = question.trim().length >= 2;

  const goHope = () => { if (canThrow) setStage('hope'); };
  const doThrow = (chosenHope: HopedSide) => {
    setHoped(chosenHope);
    const seed = buildThrowSeed(reportInput, question, Date.now() ^ Math.floor(Math.random() * 1e9));
    setFateThrow(throwFateDice(seed));
    setStage('reveal');
  };
  const doReact = (chosenReaction: Reaction) => {
    if (!fateThrow || !hoped) return;
    setReaction(chosenReaction);
    const result = synthesizeReflection(fateThrow.side, hoped, chosenReaction);
    setReflection(result);
    setStage('result');
    const record: RitualRecord = {
      id: `${Date.now()}`,
      question: question.trim(),
      diceSide: fateThrow.side,
      hoped,
      reaction: chosenReaction,
      favored: result.favored,
      cardText: fateThrow.card.text,
      createdAt: new Date().toISOString(),
    };
    void saveRitual(record).then(setHistory);
  };

  const restart = () => {
    setStage('ask');
    setQuestion('');
    setHoped(undefined);
    setFateThrow(undefined);
    setReaction(undefined);
    setReflection(undefined);
    setShareError('');
  };

  const downloadShare = async () => {
    if (!fateThrow || !reflection) return;
    setDownloading(true);
    setShareError('');
    try {
      const blob = await renderRitualShareImage({
        question: question.trim(),
        diceLabel: fateThrow.sideLabel,
        diceSide: fateThrow.side,
        headline: reflection.headline,
        cardText: fateThrow.card.text,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fateverse-ritual-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (reason) {
      setShareError(reason instanceof Error ? reason.message : '產生分享圖失敗。');
    } finally {
      setDownloading(false);
    }
  };

  const clearHistory = async () => { await clearRituals(); setHistory([]); };

  const reactionLabel = useMemo(() => REACTION_OPTIONS.find((item) => item.value === reaction)?.label ?? '', [reaction]);

  return (
    <section className="page-container page-section">
      <BackToReportLink />
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow text-gold">Decision Ritual · 擲</p>
        <h1 className="display-title mt-3">決策儀式</h1>
        <p className="mx-auto mt-5 max-w-xl muted">卡在一個難以決定的兩難？這裡不告訴你未來，也不假裝算得準。它擲一次隨機的「命運骰」，然後幫你聽見你對結果的第一反應——那個反應，才是你心裡早就有的答案。</p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        {stage === 'ask' && (
          <article className="glass-card reveal p-6 sm:p-8">
            <label className="block">
              <span className="label">你正在猶豫的決定是什麼？</span>
              <textarea
                className="input-field min-h-28 resize-none"
                placeholder="例如：我該不該離開這份工作？要不要跟他告白？該搬到另一個城市嗎？"
                value={question}
                maxLength={80}
                onChange={(event) => setQuestion(event.target.value)}
              />
              <span className="mt-1.5 block text-right text-xs text-mist">{question.length}/80</span>
            </label>
            <p className="mt-2 text-xs leading-5 text-mist">把它寫成一個可以「是／否」或「動／靜」回答的問題最有效。內容只留在你的裝置上。</p>
            <button className="btn-primary mt-5 w-full" type="button" disabled={!canThrow} onClick={goHope}>準備擲骰 <ArrowRight size={17} /></button>
          </article>
        )}

        {stage === 'hope' && (
          <article className="glass-card reveal p-6 sm:p-8">
            <p className="text-center text-sm text-mist">在擲骰之前，先誠實問自己一件事——</p>
            <h2 className="mt-2 text-center font-serif text-2xl font-semibold text-cream">你其實比較希望骰子給哪一面？</h2>
            <p className="mt-2 text-center text-xs text-mist">「動」＝往前、去做、改變；「靜」＝先等、先守、再看看。沒有標準答案，憑直覺。</p>
            <div className="mt-6 grid gap-3">
              {HOPE_OPTIONS.map((option) => (
                <button key={option.value} type="button" onClick={() => doThrow(option.value)} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-gold/40 hover:bg-white/[0.06]">
                  <span><span className="font-semibold text-cream">{option.label}</span><span className="mt-0.5 block text-xs text-mist">{option.hint}</span></span>
                  <ArrowRight className="shrink-0 text-gold" size={18} />
                </button>
              ))}
            </div>
          </article>
        )}

        {stage === 'reveal' && fateThrow && (
          <article className="glass-card reveal p-6 text-center sm:p-8">
            <p className="eyebrow text-mist">骰面停在</p>
            <div className={`mx-auto mt-4 grid size-40 place-items-center rounded-full border-2 ${fateThrow.side === 'act' ? 'border-gold/50 text-gold' : 'border-teal-300/50 text-teal-300'} pulse-glow`}>
              <div><p className="font-serif text-7xl font-bold">{fateThrow.sideLabel}</p><p className="mt-1 text-sm text-mist">{fateThrow.yinYang}</p></div>
            </div>
            <p className="mx-auto mt-6 max-w-md leading-7 text-mist">{fateThrow.flavor}</p>
            <button className="btn-primary mt-6" type="button" onClick={() => setStage('react')}>看到結果了，繼續 <ArrowRight size={17} /></button>
          </article>
        )}

        {stage === 'react' && fateThrow && (
          <article className="glass-card reveal p-6 sm:p-8">
            <h2 className="text-center font-serif text-2xl font-semibold text-cream">看到「{fateThrow.sideLabel}」的那一秒，你的第一反應是？</h2>
            <p className="mt-2 text-center text-xs text-mist">不要想太多，抓住剛剛那個瞬間最真實的感覺。</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {REACTION_OPTIONS.map((option) => (
                <button key={option.value} type="button" onClick={() => doReact(option.value)} className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-gold/40 hover:bg-white/[0.06]">
                  <span className="text-3xl">{option.emoji}</span>
                  <span className="text-sm font-semibold text-cream">{option.label}</span>
                </button>
              ))}
            </div>
          </article>
        )}

        {stage === 'result' && fateThrow && reflection && (
          <div className="reveal space-y-5">
            <article className={`overflow-hidden rounded-[2rem] border p-6 sm:p-8 ${reflection.favored === 'act' ? 'border-gold/30 bg-gold/[0.06]' : reflection.favored === 'wait' ? 'border-teal-300/30 bg-teal-300/[0.05]' : 'border-white/10 bg-white/[0.04]'}`}>
              <div className="flex items-center gap-3 text-gold"><Sparkles size={20} /><span className="eyebrow">你的鏡子照出了什麼</span></div>
              <h2 className="mt-4 font-serif text-2xl font-semibold leading-relaxed text-cream">{reflection.headline}</h2>
              <p className="mt-4 leading-8 text-mist">{reflection.body}</p>
              <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-7 text-[#e8ddc5]">{reflection.closing}</p>
            </article>

            <article className="glass-card p-5 sm:p-6">
              <div className="flex items-center gap-2.5 text-gold"><Dice5 size={19} /><span className="text-sm font-semibold tracking-wider">今日行動卡</span></div>
              <p className="mt-3 font-serif text-lg leading-8 text-cream">{fateThrow.card.text}</p>
            </article>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-5 text-mist">
              <p>這次紀錄：問題「{question.trim()}」· 骰面「{fateThrow.sideLabel}」· 你的反應「{reactionLabel}」。已存進本機歷史，可在下方查看或清除。</p>
            </div>

            {shareError && <p className="rounded-xl border border-rose-200/20 bg-rose-200/[0.08] p-3 text-sm text-rose-100" role="alert">{shareError}</p>}

            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" type="button" disabled={downloading} onClick={() => void downloadShare()}><Download size={17} />{downloading ? '產生中…' : '下載分享圖'}</button>
              <button className="btn-secondary" type="button" onClick={restart}><RefreshCw size={17} />擲另一個決定</button>
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="mx-auto mt-14 max-w-2xl">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-cream">本機歷史</h2>
            <button className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-rose-200" type="button" onClick={() => void clearHistory()}><Trash2 size={15} />清除全部</button>
          </div>
          <div className="mt-4 space-y-2.5">
            {history.map((record) => (
              <article className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5" key={record.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm text-cream">{record.question}</p>
                  <p className="mt-0.5 text-xs text-mist">{new Date(record.createdAt).toLocaleDateString('zh-TW')} · 骰面「{diceSideLabel(record.diceSide)}」{record.favored ? ` · 傾向「${diceSideLabel(record.favored)}」` : ' · 尚未決定'}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${record.favored === 'act' ? 'bg-gold/10 text-gold' : record.favored === 'wait' ? 'bg-teal-300/10 text-teal-200' : 'bg-white/[0.06] text-mist'}`}>{record.favored ? diceSideLabel(record.favored) : '—'}</span>
              </article>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-mist">歷史只存在你的裝置上，不會上傳。長期回看，你會發現自己在哪些決定上總是傾向「動」或「靜」。</p>
        </div>
      )}

      <div className="mx-auto mt-10 max-w-2xl">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-mist">
          <div className="mb-2 flex items-center gap-2 text-cream"><ShieldCheck size={16} className="text-gold" />這個儀式為什麼有用</div>
          研究顯示，人在重大選擇上往往過度保守（經濟學家 Levitt 的擲硬幣實驗中，做出改變的人半年後反而更快樂）。這裡的骰子是<strong className="text-cream">真的隨機</strong>——它的價值不在預測，而在用一個中立的結果，逼出你對它的情緒反應。那個反應，就是你早已擁有的答案。
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-2xl"><Disclaimer /></div>
    </section>
  );
}
