import { Fingerprint, Globe2, Share2, Sparkles, Waypoints } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BackToReportLink from '../components/common/BackToReportLink';
import Disclaimer from '../components/common/Disclaimer';
import ChartFingerprintArt from '../components/report/ChartFingerprintArt';
import SoundFingerprintPlayer from '../components/report/SoundFingerprintPlayer';
import { buildBirthdaySky } from '../engines/birthday-sky-engine';
import { buildChartFingerprint } from '../engines/chart-fingerprint-engine';
import { buildSoundFingerprint } from '../engines/sound-fingerprint-engine';
import { useFateStore } from '../store/useFateStore';
import { renderImprintShareImage } from '../utils/imprint-share-image';
import { shareOrDownload } from '../utils/share-file';

export default function CosmicImprintPage() {
  const input = useFateStore((state) => state.reportInput);
  const profile = useFateStore((state) => state.profileInput);
  const [downloading, setDownloading] = useState(false);
  const [shareError, setShareError] = useState('');
  // 預設不把生日快照畫進圖裡：那一段會洩漏確切出生日期，而這張圖是要貼出去的。
  const [includeBirthday, setIncludeBirthday] = useState(false);

  const fingerprint = useMemo(() => (input ? buildChartFingerprint(input) : undefined), [input]);
  const sound = useMemo(() => (input ? buildSoundFingerprint(input) : undefined), [input]);
  const sky = useMemo(() => (input && profile ? buildBirthdaySky(input, profile.birthDate) : undefined), [input, profile]);

  if (!input || !fingerprint || !sky) {
    return (
      <section className="page-container page-section text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full border border-gold/25 bg-gold/10 text-gold"><Fingerprint size={34} /></div>
        <p className="eyebrow mt-7">Cosmic Imprint</p>
        <h1 className="display-title mt-3">你的宇宙印記</h1>
        <p className="mx-auto mt-5 max-w-xl muted">完成命盤輸入後，這裡會用你的命盤生成一張獨一無二的「命之圖騰」，並呈現你出生那天真實的天空與曆法快照。</p>
        <Link className="btn-primary mt-8" to="/profile">前往探索命盤</Link>
      </section>
    );
  }

  const share = async () => {
    if (downloading) return;
    setDownloading(true);
    setShareError('');
    try {
      const blob = await renderImprintShareImage({ name: profile?.name, fingerprint, intro: sky.intro, facts: sky.facts, includeBirthday });
      // 手機上「下載」等於死路：存進相簿還要自己開 IG、找檔案。優先走系統分享。
      await shareOrDownload(blob, `fateverse-imprint-${Date.now()}.png`, '我的宇宙印記｜萬象命書');
    } catch (reason) {
      setShareError(reason instanceof Error ? reason.message : '產生分享圖失敗，請再試一次。');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="page-container page-section">
      <BackToReportLink />
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow text-gold">Cosmic Imprint</p>
        <h1 className="display-title mt-3">你的宇宙印記</h1>
        <p className="mx-auto mt-5 max-w-xl muted">影像模型先創作五行材質，命盤資料再把它長成只屬於你的有機圖騰；加上出生那天真實的天空快照。它是可重現的個人印記，不是預言。</p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-6 lg:grid-cols-2 lg:items-start">
        <article className="glass-card p-6 sm:p-7">
          <h2 className="flex items-center gap-2.5 font-serif text-xl font-semibold text-cream"><Fingerprint className="text-gold" size={20} />命之圖騰</h2>
          <div className="mt-5"><ChartFingerprintArt fingerprint={fingerprint} /></div>
          <p className="mt-4 text-sm leading-6 text-mist">五行主調會選出對應的元素世界與手繪刻紋材質；命盤種子決定刻紋帶的疏密與曲率，五行比例長成中央印記，行星落點化為星芒。同一份命盤永遠會得到同一張圖。</p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <Waypoints className="shrink-0 text-gold" size={16} />
            <p className="text-xs leading-5 text-mist">圖騰下方的六爻來自 <span className="font-mono text-cream">{fingerprint.binaryCode}</span>，是把五行與日主陰陽編成的第 {fingerprint.hexagramIndex} 號卦碼——資料仍由瀏覽器本機計算，影像模型只提供材質。</p>
          </div>
        </article>

        <article className="glass-card p-6 sm:p-7">
          <h2 className="flex items-center gap-2.5 font-serif text-xl font-semibold text-cream"><Globe2 className="text-teal-300" size={20} />你出生那天的世界</h2>
          <p className="mt-4 leading-7 text-mist">{sky.intro}</p>
          <div className="mt-5 space-y-2.5">
            {sky.facts.map((fact) => (
              <div className="flex items-baseline justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3" key={fact.label}>
                <span className="shrink-0 text-xs text-mist">{fact.label}</span>
                <span className="text-right text-sm font-semibold text-cream">{fact.value}{fact.note && <span className="mt-0.5 block text-[11px] font-normal text-mist">{fact.note}</span>}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-mist">{sky.caveat}</p>
        </article>
      </div>

      {sound && <div className="mx-auto mt-6 max-w-4xl"><SoundFingerprintPlayer fingerprint={sound} /></div>}

      {shareError && <p className="mx-auto mt-6 max-w-4xl rounded-xl border border-rose-200/20 bg-rose-200/[0.08] p-3 text-sm text-rose-100" role="alert">{shareError}</p>}

      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-gold/[0.16] bg-white/[0.03] p-4">
        <label className="flex items-start gap-2.5 text-sm leading-6 text-cream">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 accent-gold"
            checked={includeBirthday}
            onChange={(event) => setIncludeBirthday(event.target.checked)}
          />
          <span>也把「出生那天的世界」放進圖裡</span>
        </label>
        <p className="mt-1.5 pl-6.5 text-[11px] leading-5 text-mist/80">
          勾了之後，圖上會出現你的出生日期與農曆——貼到公開的地方等於公開生日。
          不勾的話圖上只有命之圖騰與卦象，看不出你的出生日期。
        </p>
      </div>

      <div className="mx-auto mt-4 flex max-w-4xl flex-wrap justify-center gap-3">
        <button className="btn-primary" type="button" disabled={downloading} onClick={() => void share()}><Share2 size={17} />{downloading ? '產生中…' : '分享我的宇宙印記'}</button>
        <Link className="btn-secondary" to="/report"><Sparkles size={17} />回到完整報告</Link>
      </div>
      <div className="mx-auto mt-10 max-w-4xl"><Disclaimer /></div>
    </section>
  );
}
