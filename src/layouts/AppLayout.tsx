import { Menu, ScrollText, Settings, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import BrandMark from '../components/common/BrandMark';
import Starfield from '../components/common/Starfield';
import { useRouteScrollReset } from '../hooks/useRouteScrollReset';
import { useFateStore } from '../store/useFateStore';

const links = [
  ['/', '首頁'],
  ['/profile', '探索命盤'],
  ['/ritual', '決策儀式'],
  ['/imprint', '宇宙印記'],
  ['/daily', '今日指引'],
  ['/tarot', '塔羅牌'],
  ['/palm', '拍手相'],
  ['/fortune', '拍籤解籤'],
  ['/mirror', '巴納姆鏡'],
  ['/about', '關於'],
] as const;

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const hasReport = useFateStore((state) => Boolean(state.reportInput));
  useRouteScrollReset(location.pathname);
  const focusMainContent = () => document.getElementById('main-content')?.focus();
  return (
    <div className="relative min-h-screen">
      <Starfield />
      <button type="button" onClick={focusMainContent} className="sr-only z-[70] rounded-lg bg-gold px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3">跳到主要內容</button>
      <header data-app-header className="sticky top-0 z-50 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
        <div className="page-container flex min-h-16 items-center justify-between">
          <Link to="/" aria-label="回到首頁" className="brand-motion"><BrandMark compact /></Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="主要導覽">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `rounded-lg px-4 py-2 text-sm transition ${isActive ? 'bg-white/10 text-cream' : 'text-mist hover:text-cream'}`}>{label}</NavLink>
            ))}
            {hasReport && (
              <NavLink to="/report" className={({ isActive }) => `ml-1 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition ${isActive ? 'border-gold/60 bg-gold/[0.16] text-cream' : 'border-gold/35 bg-gold/[0.08] text-gold hover:bg-gold/[0.14]'}`}><ScrollText size={16} />我的報告</NavLink>
            )}
            <NavLink to="/settings" aria-label="設定" className="ml-2 rounded-lg p-2 text-mist hover:bg-white/10 hover:text-cream"><Settings size={20} /></NavLink>
          </nav>
          <button className="rounded-lg p-2 text-cream md:hidden" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="切換導覽選單">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav className="mobile-menu-enter page-container grid gap-1 border-t border-white/10 py-3 md:hidden" aria-label="手機導覽">
            {hasReport && (
              <NavLink to="/report" onClick={() => setOpen(false)} className={({ isActive }) => `inline-flex items-center gap-2 rounded-lg border px-4 py-3 font-semibold ${isActive ? 'border-gold/60 bg-gold/[0.16] text-cream' : 'border-gold/35 bg-gold/[0.08] text-gold'}`}><ScrollText size={17} />我的報告</NavLink>
            )}
            {[...links, ['/settings', '設定'] as const].map(([to, label]) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `rounded-lg px-4 py-3 ${isActive ? 'bg-white/10 text-cream' : 'text-mist'}`}>{label}</NavLink>
            ))}
          </nav>
        )}
      </header>
      <main id="main-content" tabIndex={-1}><div className="route-enter" key={location.pathname}><Outlet /></div></main>
      <footer className="border-t border-white/10 py-8">
        <div className="page-container flex flex-col gap-4 text-sm text-mist sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 萬象命書 FateVerse</p>
          <div className="flex gap-5"><Link to="/privacy" className="hover:text-cream">隱私</Link><Link to="/about" className="hover:text-cream">使用聲明</Link><Link to="/settings" className="hover:text-cream">資料設定</Link></div>
        </div>
      </footer>
    </div>
  );
}
