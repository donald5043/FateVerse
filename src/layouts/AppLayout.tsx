import { Menu, Settings, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import BrandMark from '../components/common/BrandMark';

const links = [
  ['/', '首頁'],
  ['/fortune', '拍籤解籤'],
  ['/profile', '探索命盤'],
  ['/daily', '今日指引'],
  ['/about', '關於'],
] as const;

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
        <div className="page-container flex min-h-16 items-center justify-between">
          <Link to="/" aria-label="回到首頁"><BrandMark compact /></Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="主要導覽">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `rounded-lg px-4 py-2 text-sm transition ${isActive ? 'bg-white/10 text-cream' : 'text-mist hover:text-cream'}`}>{label}</NavLink>
            ))}
            <NavLink to="/settings" aria-label="設定" className="ml-2 rounded-lg p-2 text-mist hover:bg-white/10 hover:text-cream"><Settings size={20} /></NavLink>
          </nav>
          <button className="rounded-lg p-2 text-cream md:hidden" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="切換導覽選單">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav className="page-container grid gap-1 border-t border-white/10 py-3 md:hidden" aria-label="手機導覽">
            {[...links, ['/settings', '設定'] as const].map(([to, label]) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `rounded-lg px-4 py-3 ${isActive ? 'bg-white/10 text-cream' : 'text-mist'}`}>{label}</NavLink>
            ))}
          </nav>
        )}
      </header>
      <main><Outlet /></main>
      <footer className="border-t border-white/10 py-8">
        <div className="page-container flex flex-col gap-4 text-sm text-mist sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 萬象命書 FateVerse</p>
          <div className="flex gap-5"><Link to="/privacy" className="hover:text-cream">隱私</Link><Link to="/about" className="hover:text-cream">使用聲明</Link><Link to="/settings" className="hover:text-cream">資料設定</Link></div>
        </div>
      </footer>
    </div>
  );
}
