import { BrainCircuit, CheckCircle2, Eye, RefreshCw, Sparkles, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Disclaimer from '../components/common/Disclaimer';
import {
  buildDemoReportInput, drawComparison, extractRealInsights, techniqueInfo,
  TECHNIQUES, type BarnumComparison,
} from '../engines/barnum-engine';
import { useFateStore } from '../store/useFateStore';

type Stage = 'intro' | 'guessing' | 'revealed';

export default function BarnumMirrorPage() {
  const reportInput = useFateStore((state) => state.reportInput);
  const [useDemo, setUseDemo] = useState(!reportInput);
  const [stage, setStage] = useState<Stage>('intro');
  const [comparison, setComparison] = useState<BarnumComparison>();
  const [guess, setGuess] = useState<'A' | 'B'>();
  const [round, setRound] = useState(0);

  const activeInput = useMemo(() => (useDemo || !reportInput ? buildDemoReportInput() : reportInput), [useDemo, reportInput]);
  const realInsights = useMemo(() => extractRealInsights(activeInput), [activeInput]);

  const start = () => {
    setComparison(drawComparison(realInsights));
    setGuess(undefined);
    setStage('guessing');
    setRound((value) => value + 1);
  };

  const submitGuess = (label: 'A' | 'B') => {
    setGuess(label);
    setStage('revealed');
  };

  const correctSet = comparison?.sets.find((set) => set.isReal);
  const guessedCorrectly = guess && correctSet ? guess === correctSet.label : false;

  return (
    <section className="page-container page-section">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow text-amber-200">Cold reading, exposed</p>
        <h1 className="display-title mt-3">巴納姆效應鏡子</h1>
        <p className="mx-auto mt-5 max-w-xl muted">
          這個單元不算命，而是反過來拆解「算命為什麼常常感覺很準」。你會看到兩組短句：一組來自真正的命盤計算，一組是隨機挑出、幾乎誰看了都會覺得「這在講我」的通用句子。猜猜看哪一組才是真正屬於你的。
        </p>
      </div>

      {stage === 'intro' && (
        <div className="reveal mx-auto mt-10 max-w-2xl">
          <article className="glass-card p-6 sm:p-8 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full border border-amber-200/30 bg-amber-200/10 text-amber-200"><Eye size={28} /></div>
            <h2 className="mt-5 font-serif text-xl font-semibold text-cream">什麼是巴納姆效應？</h2>
            <p className="mt-3 leading-7 text-mist">巴納姆效應（也叫佛瑞效應）是指：當一段描述模糊、正面又籠統時，幾乎每個人都會覺得「這就是在講我」，即使同一段話拿給任何人看，效果都差不多。算命、星座專欄與人格測驗常常（有意或無意）利用這個效應。</p>
            {!reportInput && (
              <p className="mt-4 rounded-xl border border-gold/20 bg-gold/[0.06] p-3.5 text-sm leading-6 text-[#e8ddc5]">
                你還沒有建立自己的命盤，這裡先用一份固定的示範資料體驗；<Link className="underline underline-offset-4 hover:text-gold" to="/profile">建立你的命盤</Link>後再回來，比較會更有感覺。
              </p>
            )}
            {reportInput && (
              <label className="mt-4 flex items-center justify-center gap-2 text-sm text-mist">
                <input type="checkbox" className="size-4 accent-gold" checked={useDemo} onChange={(event) => setUseDemo(event.target.checked)} />
                改用示範資料而非我的命盤
              </label>
            )}
            <button className="btn-primary mt-6" type="button" onClick={start}><Sparkles size={17} />開始盲測</button>
          </article>
        </div>
      )}

      {(stage === 'guessing' || stage === 'revealed') && comparison && (
        <div key={round} className="reveal mx-auto mt-10 max-w-4xl">
          <p className="text-center text-sm text-mist">仔細讀完兩組短句，哪一組感覺更像在講「你」？</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {comparison.sets.map((set) => {
              const revealedState = stage === 'revealed';
              const isGuessed = guess === set.label;
              const borderTone = !revealedState
                ? 'border-white/10'
                : set.isReal
                  ? 'border-emerald-300/40 bg-emerald-300/[0.05]'
                  : 'border-amber-200/30 bg-amber-200/[0.04]';
              return (
                <article className={`glass-card p-5 sm:p-6 border ${borderTone} ${isGuessed && revealedState ? 'ring-2 ring-gold/40' : ''}`} key={set.label}>
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-2xl font-bold text-cream">組 {set.label}</span>
                    {revealedState && (
                      <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${set.isReal ? 'bg-emerald-300/10 text-emerald-200' : 'bg-amber-200/10 text-amber-200'}`}>
                        {set.isReal ? <><CheckCircle2 size={14} />真實命盤</> : <><XCircle size={14} />通用巴納姆句</>}
                      </span>
                    )}
                  </div>
                  {revealedState && isGuessed && <p className="mt-1 text-xs text-gold">你當時選了這一組</p>}
                  <ul className="mt-4 space-y-3">
                    {set.items.map((item, index) => (
                      <li className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-sm leading-6 text-mist" key={`${set.label}-${index}`}>{item}</li>
                    ))}
                  </ul>
                  {stage === 'guessing' && (
                    <button className="btn-secondary mt-5 w-full" type="button" onClick={() => submitGuess(set.label)}>我覺得這組更像我</button>
                  )}
                </article>
              );
            })}
          </div>

          {stage === 'revealed' && (
            <div className="reveal mt-8 space-y-6">
              <article className={`rounded-3xl border p-5 sm:p-6 ${guessedCorrectly ? 'border-emerald-200/25 bg-emerald-300/[0.06]' : 'border-amber-200/25 bg-amber-200/[0.06]'}`}>
                <h2 className="font-serif text-lg font-semibold text-cream">
                  {guessedCorrectly ? '你猜對了——但這不代表通用句沒有效果' : '你猜的是通用巴納姆句，而不是真實命盤'}
                </h2>
                <p className="mt-3 leading-7 text-mist">
                  {guessedCorrectly
                    ? '這次你分辨出了真正基於出生資料算出來的內容。可以再玩幾輪：句子每次都會重新隨機挑選，難度也會不太一樣。'
                    : '你選的那組其實是隨機挑出的通用句——它們刻意寫得模糊、正面、幾乎人人適用。這正是巴納姆效應的日常示範：不需要知道你是誰，也能講出「感覺很準」的話。'}
                </p>
              </article>

              <article className="glass-card p-5 sm:p-6">
                <h3 className="flex items-center gap-2.5 font-serif text-lg font-semibold text-cream"><BrainCircuit className="text-amber-200" size={20} />這組通用句用了什麼話術</h3>
                <div className="mt-4 space-y-3">
                  {comparison.genericStatements.map((statement) => {
                    const info = techniqueInfo(statement.technique);
                    return (
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5" key={statement.id}>
                        <p className="text-sm leading-6 text-cream">{statement.text}</p>
                        {info && (
                          <p className="mt-2 text-xs leading-5 text-mist">
                            <span className="rounded-full bg-amber-200/10 px-2 py-0.5 font-semibold text-amber-200">{info.label}</span>
                            <span className="ml-2">{info.description}</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>

              <div className="flex justify-center">
                <button className="btn-primary" type="button" onClick={start}><RefreshCw size={17} />再測一次</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mx-auto mt-14 max-w-4xl">
        <h2 className="text-center font-serif text-xl font-semibold text-cream">冷讀術技巧圖鑑</h2>
        <p className="mt-2 text-center text-sm text-mist">這些是心理學與冷讀術文獻中常見的話術手法，了解它們，下次看到任何「準到嚇人」的描述時，可以先想一想。</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {TECHNIQUES.map((technique) => (
            <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4" key={technique.id}>
              <h3 className="font-semibold text-cream">{technique.label}</h3>
              <p className="mt-2 text-sm leading-6 text-mist">{technique.description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-mist">
        這個單元想說的是：FateVerse 裡的八字、紫微、星座這些內容，同樣可能因為寫得夠貼心、夠正面而讓你覺得「準」。感覺準不等於它真的描述了你——最終認識自己的，永遠是你自己的觀察與經驗，不是任何一套系統。
      </div>
      <div className="mx-auto mt-6 max-w-4xl"><Disclaimer /></div>
    </section>
  );
}
