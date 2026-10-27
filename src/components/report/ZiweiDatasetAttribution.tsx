import {
  ZIWEI_DATASET_AUTHOR, ZIWEI_DATASET_LICENSE, ZIWEI_DATASET_SOURCE, ZIWEI_DATASET_STATEMENT,
} from '../../data/ziwei-dataset-attribution';

/** Always visible before the excerpt, on screen and in a printed page. */
export default function ZiweiDatasetAttribution() {
  return (
    <aside aria-label="紫微資料來源與授權" className="rounded-2xl border-2 border-gold/40 bg-gold/[0.07] p-5 text-sm leading-7 text-cream">
      <h3 className="font-serif text-lg font-semibold text-gold">資料來源與授權</h3>
      <p className="mt-3 font-semibold">{ZIWEI_DATASET_STATEMENT}</p>
      <p className="mt-2 break-words">来源：<a className="text-gold underline underline-offset-4" href={ZIWEI_DATASET_SOURCE} target="_blank" rel="noreferrer">{ZIWEI_DATASET_SOURCE}</a></p>
      <p>作者：{ZIWEI_DATASET_AUTHOR}</p>
      <p className="mt-2">授權：<a className="text-gold underline underline-offset-4" href={ZIWEI_DATASET_LICENSE} target="_blank" rel="noreferrer">CC BY 4.0</a> · <a className="text-gold underline underline-offset-4" href={`${import.meta.env.BASE_URL}data/ziwei-v4/SOURCE-LICENSE.txt`} target="_blank" rel="noreferrer">原作者使用條款與免責聲明</a></p>
      <p className="mt-3 text-mist">修改說明：僅摘錄各主題開頭摘要，保留簡體原文；經引文比對與來源檢查，另行刪除有疑慮的整段文字，並以字典及索引去重壓縮。未收錄《天紀》逐字稿；刪除不代表認定原文侵權。原作者未替 FateVerse 背書。</p>
      <p className="mt-2 text-mist">資料依原作者條款按現狀提供，不附擔保，僅供文化探索與反思，不構成預測、診斷或建議。CC BY 4.0 允許依其條件再利用本次收錄的摘要。</p>
    </aside>
  );
}
