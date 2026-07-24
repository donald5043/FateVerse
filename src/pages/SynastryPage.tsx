import { ArrowRight, GitCompareArrows, Heart, Sparkles, Split } from 'lucide-react';
import { FormEvent, useState } from 'react';
import BackToReportLink from '../components/common/BackToReportLink';
import Disclaimer from '../components/common/Disclaimer';
import { buildReportFromProfile } from '../engines/build-report';
import { generateSynastry, type SynastryReading } from '../engines/synastry-engine';
import { useFateStore } from '../store/useFateStore';
import type { ProfileInput } from '../types/fate';
import { decodeShareCodeToProfile } from '../utils/share-link';

interface MiniForm {
  name: string;
  birthDate: string;
  birthTime: string;
  timezone: string;
  gender: ProfileInput['gender'];
}

const emptyForm: MiniForm = { name: '', birthDate: '', birthTime: '', timezone: 'Asia/Taipei', gender: 'other' };
const TIMEZONES = ['Asia/Taipei', 'Asia/Tokyo', 'Asia/Hong_Kong', 'America/Los_Angeles', 'Europe/London'];

function toProfile(form: MiniForm, fallbackName: string): ProfileInput {
  return { name: form.name.trim() || fallbackName, birthDate: form.birthDate, birthTime: form.birthTime, gender: form.gender, region: '未提供', timezone: form.timezone, focus: ['all'] };
}

function MiniFields({ form, onChange, accent }: { form: MiniForm; onChange: (patch: Partial<MiniForm>) => void; accent: string }) {
  return (
    <div className="space-y-3">
      <input className="input-field" placeholder="名字或暱稱" value={form.name} maxLength={20} onChange={(event) => onChange({ name: event.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="mb-1 block text-xs text-mist">出生日期</span><input className="input-field" type="date" min="1900-01-01" max="2100-12-31" value={form.birthDate} onChange={(event) => onChange({ birthDate: event.target.value })} /></label>
        <label className="block"><span className="mb-1 block text-xs text-mist">出生時間</span><input className="input-field" type="time" value={form.birthTime} onChange={(event) => onChange({ birthTime: event.target.value })} /></label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="mb-1 block text-xs text-mist">時區</span><select className="input-field" value={form.timezone} onChange={(event) => onChange({ timezone: event.target.value })}>{TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}</select></label>
        <label className="block"><span className="mb-1 block text-xs text-mist">排盤性別</span><select className="input-field" value={form.gender} onChange={(event) => onChange({ gender: event.target.value as ProfileInput['gender'] })}><option value="other">不指定</option><option value="female">女性</option><option value="male">男性</option></select></label>
      </div>
      <div className={`h-0.5 rounded-full ${accent}`} />
    </div>
  );
}

export default function SynastryPage() {
  const savedProfile = useFateStore((state) => state.profileInput);
  const [useMine, setUseMine] = useState(Boolean(savedProfile));
  const [formA, setFormA] = useState<MiniForm>(emptyForm);
  const [formB, setFormB] = useState<MiniForm>(emptyForm);
  const [partnerLink, setPartnerLink] = useState('');
  const [reading, setReading] = useState<SynastryReading>();
  const [error, setError] = useState('');

  const applyPartnerLink = () => {
    const decoded = decodeShareCodeToProfile(partnerLink.trim());
    if (!decoded) { setError('這個分享連結無法解讀，請確認是完整的 FateVerse 分享連結。'); return; }
    setError('');
    setFormB({ name: decoded.name, birthDate: decoded.birthDate, birthTime: decoded.birthTime, timezone: decoded.timezone, gender: decoded.gender });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const profileA = useMine && savedProfile ? savedProfile : toProfile(formA, '甲方');
      const profileB = toProfile(formB, '乙方');
      if (!profileA.birthDate || !profileA.birthTime) throw new Error('請完成甲方的出生日期與時間。');
      if (!profileB.birthDate || !profileB.birthTime) throw new Error('請完成乙方的出生日期與時間。');
      const inputA = buildReportFromProfile(profileA).reportInput;
      const inputB = buildReportFromProfile(profileB).reportInput;
      setReading(generateSynastry(inputA, inputB, profileA.name.trim() || '甲方', profileB.name.trim() || '乙方'));
      window.setTimeout(() => document.getElementById('synastry-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '合盤計算失敗，請確認兩人的出生資料。');
    }
  };

  return (
    <section className="page-container page-section">
      <BackToReportLink />
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow text-vermilion">Synastry</p>
        <h1 className="display-title mt-3">兩人合盤</h1>
        <p className="mx-auto mt-5 max-w-xl muted">把兩個人的命盤並排比較，看見你們天然的互補與張力在哪裡。這不是「合不合」的分數，關係好不好，是你們一起經營出來的。所有計算都在你的裝置上。</p>
      </div>

      <form onSubmit={submit} className="mx-auto mt-10 max-w-3xl">
        <div className="grid gap-5 sm:grid-cols-2">
          <article className="glass-card p-5 sm:p-6">
            <h2 className="font-serif text-lg font-bold text-cream">甲方</h2>
            {savedProfile && (
              <label className="mt-3 flex items-center gap-2 text-sm text-mist">
                <input type="checkbox" className="size-4 accent-gold" checked={useMine} onChange={(event) => setUseMine(event.target.checked)} />
                用我已建立的命盤（{savedProfile.name || '未命名'}）
              </label>
            )}
            {!(useMine && savedProfile) && <div className="mt-4"><MiniFields form={formA} onChange={(patch) => setFormA((current) => ({ ...current, ...patch }))} accent="bg-gold/40" /></div>}
          </article>
          <article className="glass-card p-5 sm:p-6">
            <h2 className="font-serif text-lg font-bold text-cream">乙方</h2>
            <div className="mt-4"><MiniFields form={formB} onChange={(patch) => setFormB((current) => ({ ...current, ...patch }))} accent="bg-vermilion/40" /></div>
            <div className="mt-3 flex gap-2">
              <input className="input-field text-xs" placeholder="或貼上對方的 FateVerse 分享連結" value={partnerLink} onChange={(event) => setPartnerLink(event.target.value)} />
              <button type="button" className="btn-secondary shrink-0 px-4" onClick={applyPartnerLink}>帶入</button>
            </div>
          </article>
        </div>
        {error && <p className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100" role="alert">{error}</p>}
        <button className="btn-primary mt-5 w-full" type="submit"><GitCompareArrows size={18} />開始合盤 <ArrowRight size={16} /></button>
      </form>

      {reading && (
        <div id="synastry-result" className="reveal mx-auto mt-14 max-w-3xl scroll-mt-24">
          <article className="overflow-hidden rounded-[2rem] border border-vermilion/25 bg-gradient-to-br from-vermilion/[0.1] via-[#1a1226] to-[#0b1020] p-6 sm:p-8">
            <div className="flex items-center gap-3 text-[#e8927f]"><Heart size={20} /><span className="eyebrow text-[#e8927f]">{reading.nameA} × {reading.nameB}</span></div>
            <p className="mt-4 leading-8 text-cream">{reading.intro}</p>
          </article>

          <div className="mt-6 space-y-4">
            {reading.sections.map((section) => (
              <article className="glass-card p-5 sm:p-6" key={section.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-serif text-lg font-bold text-cream">{section.title}</h3>
                  <span className="rounded-full border border-gold/25 bg-gold/[0.08] px-3 py-1 text-xs text-gold">{section.verdict}</span>
                </div>
                <p className="mt-3 leading-7 text-mist">{section.reading}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {reading.highlights.map((highlight) => (
              <article className={`rounded-2xl border p-5 ${highlight.kind === 'harmony' ? 'border-emerald-200/20 bg-emerald-300/[0.05]' : 'border-vermilion/25 bg-vermilion/[0.05]'}`} key={highlight.title}>
                <div className={`flex items-center gap-2 text-xs font-bold tracking-wider ${highlight.kind === 'harmony' ? 'text-emerald-200' : 'text-[#e8927f]'}`}>
                  {highlight.kind === 'harmony' ? <Sparkles size={16} /> : <Split size={16} />}{highlight.kind === 'harmony' ? '契合點' : '磨合點'}
                </div>
                <h4 className="mt-2 font-serif text-base font-bold text-cream">{highlight.title}</h4>
                <p className="mt-2 text-sm leading-6 text-mist">{highlight.text}</p>
              </article>
            ))}
          </div>

          <section className="mt-6 rounded-2xl border border-gold/[0.16] bg-white/[0.03] p-5">
            <ul className="space-y-2 text-sm leading-6 text-mist">{reading.cautions.map((item) => <li className="flex gap-2" key={item}><span className="text-gold">·</span>{item}</li>)}</ul>
          </section>
        </div>
      )}
      <div className="mx-auto mt-10 max-w-3xl"><Disclaimer /></div>
    </section>
  );
}
