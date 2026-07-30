import { ArrowRight, FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';
import Disclaimer from '../components/common/Disclaimer';

/**
 * 實驗室。
 *
 * 這頁存在的理由是誠實面對一件事：這個站做了十幾個功能，但只有三件事
 * （今天、完整命盤、兩人合盤）真的值得放在主動線上。其餘都是做得出來、
 * 也有人喜歡，但不是每個人進站想做的事——全部擠在首頁只會讓人覺得雜。
 *
 * 收進來不等於砍掉：網址一個都沒動，之前分享出去的連結全部還能開。
 */

const EXPERIMENTS = [
  {
    to: '/mirror',
    title: '巴納姆鏡子',
    text: '兩句話，一句真的從你的命盤算出來，一句對誰都成立。分得出來嗎？',
  },
  {
    to: '/timeline',
    title: '命運回顧日誌',
    text: '過去每一年，和當年傳統命理給的框並排。只列已經過完的年份。',
  },
  {
    to: '/ritual',
    title: '決策儀式',
    text: '卡關的時候擲一下。重點不是結果，是你看到結果那一秒的反應。',
  },
  {
    to: '/narrative',
    title: '人生劇本',
    text: '把命盤寫成一段第一人稱的故事，讀起來像小說而不是報告。',
  },
  {
    to: '/imprint',
    title: '宇宙印記',
    text: '你的命之圖騰，和你出生那天實際的天空。',
  },
  {
    to: '/capsule',
    title: '時間膠囊',
    text: '寫一封給未來自己的信，到期才能打開。存在你自己的裝置上。',
  },
  {
    to: '/tarot',
    title: '塔羅三牌陣',
    text: '過去、現在、未來各抽一張。首頁的今日一張牌是它的簡版。',
  },
  {
    to: '/daily',
    title: '今日指引（完整版）',
    text: '首頁的「今天」已經是重點摘要；這裡是每一套系統的完整說法。',
  },
  {
    to: '/palm',
    title: '拍手相',
    text: '拍下手掌，分析手型與掌紋。辨識在你的瀏覽器裡跑，照片不會上傳。',
  },
  {
    to: '/fortune',
    title: '拍籤解籤',
    text: '拍下籤詩，辨識文字並找出對應的解讀。六十甲子籤與觀音一百籤。',
  },
] as const;

export default function LabPage() {
  return (
    <section className="page-container page-section">
      <div className="mx-auto max-w-2xl text-center">
        <div className="flex items-center justify-center gap-2 text-gold">
          <FlaskConical size={18} />
          <p className="eyebrow text-gold">Lab</p>
        </div>
        <h1 className="display-title mt-3">實驗室</h1>
        <p className="mx-auto mt-5 max-w-xl muted">
          這些是做出來覺得有意思、但不一定每個人都想用的東西。
          放在這裡不是因為它們壞掉了，是因為主畫面只該有三件事。
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        {EXPERIMENTS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group flex items-start gap-4 border-b border-white/[0.06] py-4 transition hover:border-gold/40"
          >
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-base font-bold text-cream transition group-hover:text-gold">{item.title}</h2>
              <p className="mt-1 text-[13px] leading-6 text-mist">{item.text}</p>
            </div>
            <ArrowRight className="mt-1 shrink-0 text-mist/40 transition group-hover:text-gold" size={15} />
          </Link>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-2xl"><Disclaimer /></div>
    </section>
  );
}
