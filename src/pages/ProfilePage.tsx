import { AlertCircle, ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateFallbackReport } from '../ai/fallback-report';
import BirthChartPreview from '../components/profile/BirthChartPreview';
import { calculateAstrology } from '../engines/astrology-engine';
import { calculateBazi } from '../engines/bazi-engine';
import { calculateFiveElements } from '../engines/five-elements-engine';
import { analyzeName } from '../engines/name-engine';
import { calculateNumerology } from '../engines/numerology-engine';
import { getZodiacResult } from '../engines/zodiac-engine';
import { calculateZiwei } from '../engines/ziwei-engine';
import { useFateStore } from '../store/useFateStore';
import type { ProfileInput } from '../types/fate';
import { loadPreferences, saveAnalysis } from '../utils/storage';

const focusOptions = ['personality', 'career', 'love', 'finance', 'family', 'relationships', 'direction', 'all'] as const;
const labels: Record<(typeof focusOptions)[number], string> = { personality: '個性', career: '工作', love: '感情', finance: '財務', family: '家庭', relationships: '人際', direction: '人生方向', all: '全部' };

export default function ProfilePage() {
  const navigate = useNavigate();
  const setProfile = useFateStore((state) => state.setProfile);
  const previousProfile = useFateStore((state) => state.profileInput);
  const [form, setForm] = useState<ProfileInput>(() => previousProfile ?? { name: '', birthDate: '', birthTime: '', gender: 'other', region: '臺灣', timezone: 'Asia/Taipei', city: '', focus: ['all'] });
  const [manualStrokes, setManualStrokes] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nameCharacters = useMemo(() => [...form.name.trim().replace(/\s+/g, '')], [form.name]);
  const birthPreview = useMemo(() => {
    if (!form.birthDate) return undefined;
    const [year, month, day] = form.birthDate.split('-').map(Number);
    const dateLabel = Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day) ? `${year} 年 ${month} 月 ${day} 日` : form.birthDate;
    if (!form.birthTime) return { dateLabel, message: '日期已收到；再填出生時間即可試算四柱。' };
    try {
      const bazi = calculateBazi({ birthDate: form.birthDate, birthTime: form.birthTime, timezone: form.timezone, gender: form.gender });
      return { dateLabel, message: `已套用 ${form.timezone}，下方為目前輸入的即時試算。`, bazi, fiveElements: calculateFiveElements(bazi.pillars) };
    } catch (reason) {
      return { dateLabel, message: reason instanceof Error ? reason.message : '目前無法試算這組出生資料。' };
    }
  }, [form.birthDate, form.birthTime, form.gender, form.timezone]);

  const update = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) => {
    setError('');
    setForm((current) => ({ ...current, [key]: value }));
  };
  const toggleFocus = (value: string) => setForm((current) => {
    if (value === 'all') return { ...current, focus: ['all'] };
    const withoutAll = current.focus.filter((item) => item !== 'all');
    return { ...current, focus: withoutAll.includes(value) ? withoutAll.filter((item) => item !== value) : [...withoutAll, value] };
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      if (!form.birthDate) throw new Error('請先選擇出生日期。');
      if (!form.birthTime) throw new Error('請填寫出生時間；若不確定，可先用最接近的時間試算。');
      if (!form.name.trim()) throw new Error('請填寫姓名；未收錄的文字會標示資料不足，不會偽造筆畫。');
      if (!form.gender || !form.region.trim() || !form.timezone.trim()) throw new Error('請完成性別、出生地區與時區欄位。');
      if (!form.focus.length) throw new Error('請至少選擇一個想了解的主題。');
      const bazi = calculateBazi(form);
      const fiveElements = calculateFiveElements(bazi.pillars);
      const reportInput = {
        userFocus: form.focus,
        bazi,
        fiveElements,
        zodiac: getZodiacResult(bazi.zodiac),
        astrology: calculateAstrology(form),
        ziwei: calculateZiwei(form),
        numerology: calculateNumerology(form.birthDate),
        nameAnalysis: form.name.trim() ? analyzeName(form.name, fiveElements.weakest, manualStrokes) : undefined,
      };
      const report = generateFallbackReport(reportInput);
      setProfile(form, reportInput, report);
      try {
        const preferences = await loadPreferences();
        if (preferences.retainAnalysis) await saveAnalysis(form, reportInput);
      } catch {
        setError('報告已建立，但無法寫入本地儲存；本次結果仍可正常查看。');
      }
      navigate('/report');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '命盤計算失敗，請重新確認輸入資料。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="page-container page-section pb-28 lg:pb-14">
      <div className="max-w-3xl"><p className="eyebrow">Cross-cultural profile</p><h1 className="display-title mt-3">探索命盤</h1><p className="mt-5 muted">填一下出生資料，我們就能整理出四柱、十神、大運、紫微十二宮、行星黃道位置、生肖與生命靈數，再用輕鬆的方式講給你聽。</p></div>
      <div className="mt-9 notice flex items-start gap-3"><LockKeyhole className="mt-0.5 shrink-0 text-gold" size={19} /><p>所有資料只在目前瀏覽器中運算，不會上傳至伺服器。出生資料預設不會永久保存。</p></div>
      <ol className="mt-6 grid grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]" aria-label="建立報告流程">
        {['出生資料', '關注主題', '萬象報告'].map((step, index) => <li className="flex items-center gap-2 border-r border-white/10 px-3 py-3 text-xs text-mist last:border-r-0 sm:px-5 sm:text-sm" key={step}><span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${index === 0 ? 'bg-gold text-ink' : 'bg-white/10 text-cream'}`}>{index + 1}</span><span>{step}</span></li>)}
      </ol>
      <form onSubmit={submit} className="mt-7 grid items-start gap-7 lg:grid-cols-[1fr_0.72fr]" noValidate>
        <div className="glass-card space-y-6 p-5 sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="label">姓名 *</span><input className="input-field" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="例：林安晨；未收錄的字會標示資料不足" autoComplete="name" required /></label>
            <label><span className="label">出生日期 *</span><input className="input-field" type="date" min="1900-01-01" max="2100-12-31" value={form.birthDate} onChange={(e) => update('birthDate', e.target.value)} required /></label>
            <label><span className="label">出生時間 *</span><input className="input-field" type="time" value={form.birthTime} onChange={(e) => update('birthTime', e.target.value)} required /><span className="mt-1.5 block text-xs text-mist">採用所在地標準時間；第一版不猜測真太陽時。</span></label>
            <div><span className="label">命理排盤性別 *</span><div className="flex gap-2" role="group" aria-label="命理排盤性別">{([['female', '女性'], ['male', '男性'], ['other', '不指定']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={form.gender === value} onClick={() => update('gender', value)} className={`h-10 rounded-[10px] border px-4 text-[13.5px] font-semibold transition ${form.gender === value ? 'border-gold/70 bg-gold/[0.12] text-cream' : 'border-white/15 bg-white/[0.04] text-mist hover:border-gold/40'}`}>{label}</button>)}</div></div>
            <label><span className="label">出生地區 *</span><input className="input-field" value={form.region} onChange={(e) => update('region', e.target.value)} placeholder="例：臺灣" required /></label>
            <label><span className="label">時區 *</span><select className="input-field" value={form.timezone} onChange={(e) => update('timezone', e.target.value)}><option value="Asia/Taipei">Asia/Taipei (UTC+8)</option><option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option><option value="Asia/Hong_Kong">Asia/Hong_Kong (UTC+8)</option><option value="America/Los_Angeles">America/Los_Angeles</option><option value="Europe/London">Europe/London</option></select></label>
            <label><span className="label">出生城市（選填）</span><input className="input-field" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="例：臺北市" /></label>
            <label><span className="label">經度（選填）</span><input className="input-field" type="number" min="-180" max="180" step="0.0001" value={form.longitude ?? ''} onChange={(e) => update('longitude', e.target.value ? Number(e.target.value) : undefined)} /></label>
            <label><span className="label">緯度（選填）</span><input className="input-field" type="number" min="-90" max="90" step="0.0001" value={form.latitude ?? ''} onChange={(e) => update('latitude', e.target.value ? Number(e.target.value) : undefined)} /></label>
          </div>
          {birthPreview && <div role="status" aria-live="polite">{birthPreview.bazi && birthPreview.fiveElements ? <BirthChartPreview bazi={birthPreview.bazi} fiveElements={birthPreview.fiveElements} /> : <div className="rounded-xl border border-gold/25 bg-gold/[0.07] p-4"><p className="text-sm font-semibold text-gold">出生資料已生效：{birthPreview.dateLabel}</p><p className="mt-1.5 text-sm leading-6 text-mist">{birthPreview.message}</p></div>}</div>}
          {nameCharacters.length > 0 && <div><h2 className="label">姓名筆畫資料（選填修正）</h2><p className="mb-3 text-xs leading-5 text-mist">未輸入時使用少量示範現代筆畫；沒有資料的字不會偽造。手動值會在報告標示來源。</p><div className="flex flex-wrap gap-3">{nameCharacters.map((character, index) => <label key={`${character}-${index}`} className="flex items-center gap-2 rounded-xl border border-white/10 p-2"><span className="grid size-9 place-items-center rounded-lg bg-white/5 font-serif">{character}</span><input aria-label={`${character}的手動筆畫`} className="w-20 rounded-lg border border-white/10 bg-ink px-2 py-2" type="number" min="1" max="64" placeholder="筆畫" value={manualStrokes[character] ?? ''} onChange={(e) => setManualStrokes((current) => ({ ...current, [character]: Number(e.target.value) || 0 }))} /></label>)}</div></div>}
        </div>
        <aside className="glass-card p-5 sm:p-7 lg:sticky lg:top-24">
          <div className="flex items-center gap-3"><Sparkles className="text-gold" /><h2 className="font-serif text-xl font-semibold">想了解的主題</h2></div>
          <div className="mt-5 flex flex-wrap gap-2">{focusOptions.map((value) => <button key={value} type="button" onClick={() => toggleFocus(value)} className={`chip ${form.focus.includes(value) ? 'chip-active' : ''}`} aria-pressed={form.focus.includes(value)}>{labels[value]}</button>)}</div>
          <div className="mt-6 rounded-xl bg-white/[0.04] p-4 text-sm leading-6 text-mist"><p className="font-semibold text-cream">計算範圍</p><p className="mt-2">八字採農曆與節氣換算；紫微採通行排法；西洋星盤計算十大行星與主要相位。填了經緯度才會計算上升與十二宮。</p></div>
          {error && <div className="mt-5 flex items-start gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100" role="alert"><AlertCircle className="mt-0.5 shrink-0" size={17} />{error}</div>}
          <button className="btn-primary mt-6 w-full" type="submit" disabled={busy}>{busy ? '正在計算…' : '完成計算並查看報告'}<ArrowRight size={18} /></button>
        </aside>
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/95 p-3 backdrop-blur lg:hidden"><button className="btn-primary w-full" type="submit" disabled={busy}>{busy ? '正在計算…' : '完成計算並查看報告'}<ArrowRight size={18} /></button></div>
      </form>
    </section>
  );
}
