import { Download, Fingerprint, Globe2, Sparkles, Waypoints } from 'lucide-react';
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

export default function CosmicImprintPage() {
  const input = useFateStore((state) => state.reportInput);
  const profile = useFateStore((state) => state.profileInput);
  const [downloading, setDownloading] = useState(false);
  const [shareError, setShareError] = useState('');

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

  const downloadShare = async () => {
    setDownloading(true);
    setShareError('');
    try {
      const blob = await renderImprintShareImage({ name: profile?.name, fingerprint, intro: sky.intro, facts: sky.facts });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fateverse-imprint-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (reason) {
      setShareError(reason instanceof Error ? reason.message : '產生分享圖失敗。');
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
        <p className="mx-auto mt-5 max-w-xl muted">一張由你的命盤生成、獨一無二的「命之圖騰」，加上你出生那天真實的天空快照。都是可算的事實與程序生成的圖形，不是預言——但它只屬於你。</p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-6 lg:grid-cols-2 lg:items-start">
        <article className="glass-card p-6 sm:p-7">
          <h2 className="flex items-center gap-2.5 font-serif text-xl font-semibold text-cream"><Fingerprint className="text-gold" size={20} />命之圖騰</h2>
          <div className="mt-5"><ChartFingerprintArt fingerprint={fingerprint} /></div>
          <p className="mt-4 text-sm leading-6 text-mist">這張圖由你的命盤程序化生成：外圈與輻條的疏密來自你的命盤種子，中央的五角星形正比於你的五行占比，落點對應你的行星位置。</p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <Waypoints className="shrink-0 text-gold" size={16} />
            <p className="text-xs leading-5 text-mist">底部的 <span className="font-mono text-cream">{fingerprint.binaryCode}</span> 是把你的五行與日主陰陽編成的二進位卦碼（第 {fingerprint.hexagramIndex} 號）——呼應萊布尼茲 1703 年發現的「易經即二進位」。</p>
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

      <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-3">
        <button className="btn-primary" type="button" disabled={downloading} onClick={() => void downloadShare()}><Download size={17} />{downloading ? '產生中…' : '下載宇宙印記分享圖'}</button>
        <Link className="btn-secondary" to="/report"><Sparkles size={17} />回到完整報告</Link>
      </div>
      <div className="mx-auto mt-10 max-w-4xl"><Disclaimer /></div>
    </section>
  );
}
