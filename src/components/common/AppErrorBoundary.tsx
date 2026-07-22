import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryState { hasError: boolean }

export default class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState { return { hasError: true }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('FateVerse render error', error, info);
  }

  private returnHome = () => {
    window.location.hash = '#/';
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="page-container grid min-h-[75vh] place-items-center py-12 text-center">
        <section className="glass-card max-w-xl p-7 sm:p-10" role="alert">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-amber-200/10 text-amber-100"><AlertTriangle size={25} /></span>
          <p className="eyebrow mt-6">Recoverable error</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-cream">這個頁面暫時無法顯示</h1>
          <p className="mt-4 leading-7 text-mist">你的資料沒有被上傳。可以先回首頁重試；若剛更新網站，重新載入通常能取得最新資源。</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3"><button className="btn-primary" type="button" onClick={() => window.location.reload()}><RefreshCw size={17} />重新載入</button><button className="btn-secondary" type="button" onClick={this.returnHome}><Home size={17} />回到首頁</button></div>
        </section>
      </main>
    );
  }
}
