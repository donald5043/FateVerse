import { Database, EyeOff, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return <section className="page-container page-section max-w-4xl"><p className="eyebrow">Privacy by design</p><h1 className="display-title mt-3">你的資料，不必離開瀏覽器</h1><div className="mt-9 grid gap-5 sm:grid-cols-3">{[{icon:EyeOff,title:'本地運算',text:'命盤與圖片在瀏覽器內處理，不送往 FateVerse 伺服器。'},{icon:Database,title:'預設不保留',text:'出生資料預設只存在目前分頁的記憶體。'},{icon:Trash2,title:'隨時清除',text:'設定頁可清除偏好、最近結果與網站快取。'}].map(({icon:Icon,title,text})=><article className="glass-card p-5" key={title}><Icon className="text-gold"/><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-mist">{text}</p></article>)}</div><p className="mt-8 muted">OCR 語言資料與 WebLLM 模型會從其套件指定的公開內容網路下載並快取於裝置；只有在你按下辨識或啟用 AI 後才開始。圖片與出生資料不會包含在下載請求中。</p><Link to="/settings" className="btn-primary mt-8">管理本地資料</Link></section>;
}
