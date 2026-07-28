import { Gem } from 'lucide-react';
import { useMemo } from 'react';
import { describeRate, detectRareFeatures } from '../../engines/rare-features-engine';
import type { FateReportInput } from '../../types/fate';

/**
 * 這張盤少見的地方。
 *
 * 報告如果每一段都用同樣的力道講話，讀起來就沒有重點。三合局、純陽、命宮無主星
 * 這些東西多數人沒有——有的人如果只看到跟別人一樣的敘述，那份報告就白算了。
 *
 * 每一項都附實測出現率。這個數字是 500 組合成命盤跑出來的，不是修辭：
 * 說「大約每 31 個人有 1 個」就必須真的是 3.2%。
 */
export default function RareFeaturesCard({ input }: { input: FateReportInput }) {
  const features = useMemo(() => detectRareFeatures(input), [input]);

  return (
    <article className="rounded-[22px] border border-gold/25 bg-gradient-to-br from-gold/[0.07] to-white/[0.02] p-6" data-testid="rare-features">
      <div className="flex items-center gap-2.5 text-gold">
        <Gem size={18} /><p className="eyebrow text-gold">少見的地方</p>
      </div>

      {features.length === 0 ? (
        <>
          <h3 className="mt-3 font-serif text-xl font-bold text-cream">你的盤沒有特別誇張的地方</h3>
          <p className="mt-2.5 leading-7 text-mist">
            我們檢查了三合、三會、純陽純陰、五行缺角、命宮無主星等十幾種傳統上會被特別點出來的配置，你這張盤都沒踩到。
            大約一半的人也是這樣。
          </p>
          <p className="mt-2.5 leading-7 text-mist">
            這件事本身值得說一下：算命最常見的結果就是「你很普通」，只是很少有人這樣告訴你。
          </p>
        </>
      ) : (
        <>
          <h3 className="mt-3 font-serif text-xl font-bold text-cream">
            這張盤有 {features.length} 個少見的地方
          </h3>
          <p className="mt-2 text-xs text-mist/70">出現率由 500 組合成命盤實測，稀有的排前面。</p>
          <ul className="mt-4 space-y-3">
            {features.map((feature) => (
              <li className="rounded-2xl border border-white/10 bg-ink/40 p-4" key={feature.id}>
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="font-serif text-base font-bold text-cream">{feature.label}</span>
                  <span className="text-xs text-mist">{feature.detail}</span>
                  <span className="ml-auto shrink-0 rounded-full border border-gold/25 bg-gold/[0.08] px-2.5 py-0.5 text-[11px] text-gold">
                    {describeRate(feature.rate)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-mist">{feature.meaning}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-4 text-[11px] leading-5 text-mist/60">
        「少見」講的是這個配置在樣本裡出現得少，不代表比較好或比較準。樣本是均勻取樣的合成命盤，不是真實人口分布。
      </p>
    </article>
  );
}
