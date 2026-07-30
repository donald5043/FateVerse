import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * 摺疊區塊。預設收起來。
 *
 * 用原生的 `<details>`／`<summary>` 而不是自己管 state：
 * 鍵盤操作、螢幕閱讀器的展開狀態、Ctrl+F 找頁內文字、以及列印時要不要展開，
 * 瀏覽器都已經處理好了。自己用 useState 寫一遍只會少掉這些。
 *
 * 存在的理由：報告 overview 原本一次攤開四千多字，使用者的回饋是看不懂不想用。
 * 深度沒有錯，錯的是預設就把深度倒在人臉上。
 */
export default function Collapsible({
  title, hint, children, className = '', defaultOpen = false, id,
}: {
  title: string;
  /** 收起狀態下的一行提示，讓人知道展開會看到什麼。 */
  hint?: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  /** 給頁內錨點連結用。 */
  id?: string;
}) {
  return (
    <details
      id={id}
      className={`group rounded-[20px] border border-white/10 bg-white/[0.03] ${className}`}
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-left [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-base font-semibold text-cream">{title}</h3>
          {hint && <p className="mt-0.5 text-[13px] leading-6 text-mist">{hint}</p>}
        </div>
        <ChevronDown
          className="shrink-0 text-mist transition group-open:rotate-180"
          size={18}
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-white/10 px-5 py-5">{children}</div>
    </details>
  );
}
