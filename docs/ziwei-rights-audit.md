# 紫微 v4.0 摘錄的來源與引文檢查

檢查日期：2026-10-27。目的：補強第一版僅靠姓名與書名篩除的不足，並依原作者指定格式提供顯眼署名。此文件記錄實際技術措施與範圍，不宣稱法律零風險。

## 來源及授權

- 摘錄來源：[Renhuai123/ziwei-doushu v4.0-13d](https://github.com/Renhuai123/ziwei-doushu/releases/tag/v4.0-13d)，作者王多鱼AI，內容版本 `ca268829f7a9`。
- 資料集授權：[DATASET-LICENSE](https://github.com/Renhuai123/ziwei-doushu/blob/main/DATASET-LICENSE)，CC BY 4.0。允許摘錄與修改；原作者指定署名格式、第三方引文例外及免責聲明均須一併注意。
- [《天紀》語料授權](https://github.com/Renhuai123/ziwei-doushu/blob/main/docs/tianji-ziwei/LICENSE.md) 是 CC BY-NC-SA 4.0，並保留原課程權利；不將這份語料當成 CC BY 或 MIT 內容發佈。
- [CC BY 4.0 第 3 節](https://creativecommons.org/licenses/by/4.0/legalcode.en#s3) 涉及署名、授權及免責聲明、來源連結、修改標記的保留；本次另將上游條款原文隨資料附上。

## 實際覆蓋與判讀

初始公開字典共有 633 個非空摘要，拆成 975 個不重複段落，涵蓋全部 674,976 張盤 × 13 主題的文字引用。檢查的是去重後的每一段，不必重複審看相同文字。

比對基準是上游 `docs/tianji-ziwei/entries.jsonl` 的 1,848 條 `quote`，Git blob SHA-1 固定為 `9d3b67100983804ab96184615a079aec23c3687b`；SHA-256 與來源位置另記於 `scripts/ziwei-v4-rights-review.json`。語料僅留在被 Git 忽略的 `.cache/ziwei-rights-audit/`，不提交、不進 public、不進建置產物。

1. 每一段均做 NFKC 正規化、去除標點與空白，與固定語料比對連續文字重合；兩份輸入均為簡體中文。本次未做完整繁簡互轉或語意改寫偵測。
2. 8 個以上正規化字元的重合只作為工程檢查觸發條件，**不是法律上的侵權判定門檻**。初始找到兩段各有 10 字的職業名稱列表重合，沒有 12 字以上的重合。
3. 加上書名、引述與來源標記，共 42 個候選段落，已完整閱讀。40 個來源標記候選中，8 個是普通敘述的誤報，如「講義氣」或「他們講的道理」；其餘 32 個有古籍或來源引述。
4. 再檢視其餘內容內 62 個不重複的引號短語，內容為日常對話、自我提問或詞語強調；補充來源標記檢查命中的是合約「逐字」閱讀、配偶稱謂等普通語境。
5. 保守移除兩段短重合職業列表與 32 段含來源引述的整段，不嘗試改寫成近義句，也不認定這 34 段已構成侵權。部分引述所指古籍屬公有領域；本次仍不依賴其版本與現代整理權利判斷。

結果：保留 941 個不重複段落，35 個摘要字典位置有變動；仍保留全部日期／時辰／性別索引，77 個二進位索引檔完全不變。清理後再次與相同語料比對，未再命中 8 字以上重合，剩餘 8 個來源標記均為已檢視的普通語境誤報。

## 防止內容回流

`scripts/ziwei-v4-rights-review.json` 只記錄雜湊、判讀分類、來源識別及範圍，**不重貼被刪段落或課程引文**。`scripts/ziwei_rights_policy.py` 只允許列入清單的原始摘要及保留結果，拒絕新文字；對排除段落一律整段省略。重建器和現有字典清理器共用同一政策。

網站只接受清理後的 `v4.0-13d-excerpts-2`。測試與建置檢查會驗證字典段落／摘要雜湊、政策檔雜湊、來源署名、授權連結與免責聲明檔，並確認完整條款納入離線快取。這些措施防止舊版或未經檢查的資料悄悄回流；不等於判定所有保留內容必然不存在第三方權利。

## 重現

先將固定語料下載至忽略目錄，僅供本機比對。若來源 Git blob 改變，掃描器會停止，須先檢視新版本，不能自動沿用本次記錄。

```bash
python scripts/audit-ziwei-rights.py --corpus .cache/ziwei-rights-audit/tianji-entries.jsonl --report .cache/ziwei-rights-audit/scan.json
python scripts/apply-ziwei-rights-review.py
python -m unittest discover -s scripts/tests -p test_ziwei_rights_policy.py
```

掃描報告可能包含待排除原文，必須留在忽略目錄，不得提交或發佈。對未確認的來源、新摘要或權利方提出異議的文字，採先停用再釐清的方式，不以字數門檻、改寫或作者的概括授權取代個別權利確認。
