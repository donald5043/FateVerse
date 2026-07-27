# FateVerse Codebase Map

> 由 Prompt 0（Codebase Recon）產出，供後續功能開發作為事實基礎。
> 建立日期：2026-07-26。所有路徑與簽章皆自實際檔案擷取，未經推測。
> 標示「未找到」者代表 repo 中確實不存在，不是省略。

---

## ⚠️ 先讀：計劃與現況的落差

執行 Prompt 0 時發現，計劃書（依 README 撰寫）與 repo 現況有數項重大出入。後續 prompt 執行前務必先確認：

| 計劃 | 現況 | 影響 |
| --- | --- | --- |
| **Prompt 5 合盤** | **已完整實作**：路由 `#/synastry`、`src/engines/synastry-engine.ts`、`src/pages/SynastryPage.tsx`、測試 `tests/synastry-sound.test.ts` | 不是新功能。應改為「補齊缺少的部分」——目前缺：星盤相位比對、base64url 分享連結、明確的資料外洩警告 |
| **Prompt 7 巴納姆前台化** | **大致已完成**：首頁已有「看見自己」專區，巴納姆鏡子為第一張卡；`index.html` meta 與 OG description 已含「一面鏡子，不是一本預言書」；README 標語同步 | 剩餘：入口文案未採挑戰式提問、未標示「不用輸入任何資料也能玩」 |
| **Prompt 2 Canvas 分享圖** | **部分存在**：`src/utils/imprint-share-image.ts` 已是 1080×1350 Canvas 直式圖（宇宙印記頁）；另有 `ritual-share-image.ts` | 可重用既有繪圖慣例。缺的是「報告頁的五行雷達 + 速寫標語」分享圖 |
| **Prompt 3 每日運勢** | 既有「今日指引」確為 66 張靜態卡（`public/data/daily-guidance.json`），與命盤無關 | 與計劃描述一致，為真正的新功能 |
| **WebLLM** | **已於本專案完整移除**，全站改為純規則式、可離線 | 計劃未提及，但所有「MUST NOT 呼叫 WebLLM」的約束現已自動成立 |

---

## 1. `src/` 目錄樹（深度 3）

```
src/
├── components/
│   ├── charts/      圖表元件
│   ├── common/      跨頁共用（版面、品牌、免責、分享連結）
│   ├── profile/     命盤輸入表單相關
│   └── report/      報告頁專用面板
├── data/            靜態 TS 內容模組
├── engines/         純函式命理引擎（27 檔）
├── hooks/
├── layouts/
├── pages/           17 個頁面元件
├── store/           Zustand
├── types/           型別定義
└── utils/           工具（儲存、分享、捲動、常數）
```

TypeScript 檔案共 97 個。

**注意**：`src/data/`（TS 模組）才是主要靜態內容位置。`public/data/` 中僅 `daily-guidance.json` 與 `fortune-sticks/*.json` 實際被載入；`numerology.json`、`zodiac.json`、`western-zodiac.json`、`name-dictionary.json` **無任何程式引用（死檔）**，對應內容內嵌於各 engine 或 `src/data/`。

---

## 2. Engine 清單與匯出簽章

| 檔案 | 匯出 |
| --- | --- |
| `astrology-engine.ts` | `calculateSunSign(birthDate: string): AstrologyResult`<br>`calculateMajorAspects(planets: PlanetPosition[]): AspectResult[]`<br>`calculateAstrologyDistribution(planets: PlanetPosition[]): AstrologyDistribution`<br>`calculateHouseEmphasis(planetHouses: Record<string, number>): AstrologyHouseEmphasis`<br>`calculateAstrology(input): AstrologyResult` |
| `astronomy-adapter.ts` | `zodiacPosition(longitude: number)`、`calculatePlanetPositions(date: Date): PlanetPosition[]`、`calculateAscendant(date, latitude, longitude): number`、`const astronomyAdapterStatus` |
| `barnum-engine.ts` | `buildDemoReportInput(): FateReportInput`、`extractRealInsights(input): string[]`、`pickStatementsByIndex(indices: number[])`、`drawGenericStatements(count = 4)`、`buildComparison(realInsights, genericStatements, swapSides)`、`drawComparison(realInsights, count = 4)`、`techniqueInfo(id: string)` |
| `bazi-analysis-engine.ts` | `tenGodCategory(dayElement: ElementName, otherElement: ElementName): TenGodCategory`<br>`analyzeDayMaster(bazi: BaziResult): DayMasterAnalysis`<br>`yearGanZhi(year: number): string`<br>`calculateYearFortunes(bazi, analysis, startYear, count = 3): YearFortune[]` |
| `bazi-engine.ts` | `parseBirthDateTime(birthDate, birthTime, timezone): ParsedBirth`<br>`calculateBazi(input): BaziResult` |
| `bazi-relations-engine.ts` | `calculateBaziRelations(pillars: BaziPillar[]): BaziRelation[]` |
| `bazi-strength-engine.ts` | `calculateHiddenStemWeights(branch, hiddenStems, hiddenTenGods): BaziHiddenStemWeight[]`<br>`calculateSeasonStrength(monthBranch: string): BaziSeasonStrength` |
| `birthday-sky-engine.ts` | `buildBirthdaySky(input, birthDate, now = new Date())` |
| `build-report.ts` | `buildReportFromProfile(profile, manualStrokes = {}): { reportInput: FateReportInput; report: AiFateReport }` |
| `char-data.ts` | `unihanStrokes(character)`、`unihanElement(character)`、`unihanRadical(character)` |
| `chart-fingerprint-engine.ts` | `buildChartFingerprint(input): ChartFingerprint`、`const FINGERPRINT_SIZE` |
| `decision-ritual-engine.ts` | `chartSeedSignature(input): string`、`throwFateDice(seed)`、`buildThrowSeed(input, question, nonce)`、`synthesizeReflection(diceSide, hoped, reaction)`、`diceSideLabel(side)` |
| `fallback-report.ts` | `generateFallbackReport(input: FateReportInput): AiFateReport` |
| `five-elements-engine.ts` | `stemToElement(stem): ElementName`、`branchToElement(branch): ElementName`、`calculateFiveElements(pillars): FiveElementResult`、`const STEM_ELEMENTS`、`const BRANCH_ELEMENTS` |
| `fortune-stick-matcher.ts` | `matchFortuneSticks(query, sticks, limit = 3): FortuneMatch[]`、`loadFortuneSticks(system): Promise<FortuneStick[]>` |
| `fusion-engine.ts` | `elementVibe(element)`、`numerologyElement(lifePathNumber)`、`parseZiweiClassElement(fiveElementsClass)`、`buildSystemMatrix(input, options): FusionMatrix`、`generateSystemConclusions(input): SystemConclusion[]`、`generateTimelineReading(input, targetYear?): TimelinePhase[]`、`generateFusionReading(input, options): FusionReading` |
| `image-preprocessor.ts` | `prepareImage(file)`、`applyImageMode(source, mode)`、`rotateCanvas(source)`、`centerCropCanvas(source)` |
| `integration-engine.ts` | `buildUnifiedElementProfile(input, options): UnifiedElementProfile` |
| `name-engine.ts` | `analyzeName(fullName, weakest, manualStrokes = {}): NameAnalysisResult` |
| `narrative-engine.ts` | `generateLifeNarrative(input): LifeNarrative` |
| `numerology-engine.ts` | `calculateNumerology(birthDate): NumerologyResult` |
| `palm-analyzer.ts` | `analyzePalmPixels(image): PalmAutoAnalysis`、`analyzePalmImageFile(file): Promise<PalmAutoAnalysis>` |
| `palm-engine.ts` | `palmShapeElement(selections)`、`buildPalmReading(selections)`、`const PALM_FEATURES` |
| `sound-fingerprint-engine.ts` | `buildSoundFingerprint(input): SoundFingerprint` |
| `synastry-engine.ts` | `generateSynastry(inputA, inputB, nameA = '甲方', nameB = '乙方'): SynastryReading` |
| `tarot-engine.ts` | `getBirthCards(birthDateDigits)`、`birthCardElements(birthDateDigits)`、`buildSpread(cardIds, reversals)`、`drawSpread()` |
| `time-capsule-engine.ts` | `capsuleStatus`、`daysUntil`、`daysSince`、`computeOpenDate`、`sortCapsules`、`const CAPSULE_PRESETS`、`const OUTCOME_LABELS` |
| `ziwei-engine.ts` | `const DEFAULT_ZIWEI_SETTINGS`、`birthHourToZiweiIndex(birthTime): number`、`calculateZiwei(...)`（`src/engines/ziwei-engine.ts:51`） |
| `zodiac-engine.ts` | `normalizeZodiacAnimal(animal)`、`getZodiacResult(animal): ZodiacResult` |

---

## 3. 核心型別

全部定義於 **`src/types/fate.ts`**（唯一的命盤型別檔）。

```ts
// src/types/fate.ts:464
export interface FateReportInput {
  userFocus: string[];
  bazi: BaziResult;
  fiveElements: FiveElementResult;
  zodiac: ZodiacResult;
  astrology: AstrologyResult;
  ziwei?: ZiweiResult;          // 需排盤性別，可能缺
  numerology: NumerologyResult;
  nameAnalysis?: NameAnalysisResult;  // 需姓名，可能缺
}
```

```ts
// src/types/fate.ts:475（AI 移除後已無 mode / aiEnhancement 欄位）
export interface AiFateReport {
  summary: string;
  sharedPatterns: string[];
  differences: string[];
  sections: {
    bazi: string; zodiac: string; astrology: string;
    ziwei?: string; numerology: string; name?: string;
  };
  focusAnalysis: { topic: string; analysis: string; suggestions: string[] }[];
  cautions: string[];
}
```

---

## 4. 路由表（HashRouter，base `/`）

| 路徑 | 頁面元件 |
| --- | --- |
| `/`（index） | `HomePage` |
| `/profile` | `ProfilePage` |
| `/report` | `ReportPage` |
| `/fortune` | `FortunePage` |
| `/daily` | `DailyPage` |
| `/tarot` | `TarotPage` |
| `/palm` | `PalmPage` |
| `/mirror` | `BarnumMirrorPage` |
| `/ritual` | `RitualPage` |
| `/imprint` | `CosmicImprintPage` |
| `/narrative` | `NarrativePage` |
| `/capsule` | `TimeCapsulePage` |
| **`/synastry`** | **`SynastryPage`（已存在）** |
| `/shared` | `SharedProfilePage` |
| `/about` | `AboutPage` |
| `/privacy` | `PrivacyPage` |
| `/settings` | `SettingsPage` |
| `*` | `<Navigate>` |

全部集中於 `src/App.tsx`，外層包 `AppLayout`。

---

## 5. Zustand store

只有 **一個** store：`src/store/useFateStore.ts`。

```ts
interface FateState {
  profileInput?: ProfileInput;
  reportInput?: FateReportInput;
  report?: AiFateReport;
  ocrText: string;
  selectedFortune?: FortuneStick;
  fortuneTopic: FortuneTopic;
  customQuestion: string;
  uiTheme: 'dark' | 'system';
  palmElement?: ElementName;
  // actions
  setPalmElement / setProfile / setReportData / setReport / setOcrText
  selectFortune / setFortuneTopic / setCustomQuestion / setUiTheme / clearSession
}
```

記憶體狀態，重新整理即消失；持久化另由 `src/utils/storage.ts` 負責。

---

## 6. 大運／流年／流月／流日

**八字側**（`src/engines/bazi-engine.ts:73`）：由 `lunar-javascript` 的 `yun.getDaYun(9)` 產出，取前 8 組寫入 `BaziResult.luckCycles`。

```ts
// src/types/fate.ts:82
export interface BaziLuckCycle {
  ganZhi: string;
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
}
```

流年干支計算：`yearGanZhi(year: number): string`（`bazi-analysis-engine.ts`）
流年十神與吉凶傾向：`calculateYearFortunes(bazi, analysis, startYear, count = 3): YearFortune[]`
**八字側未找到「流月／流日」計算。**

**紫微側**（`src/engines/ziwei-engine.ts:51` `calculateZiwei`，底層為 `iztro`）：四層運限齊備。

```ts
// src/types/fate.ts:251
export interface ZiweiHoroscopeLayer {
  name: string; heavenlyStem: string; earthlyBranch: string;
  palaceName: string; mutagens: ZiweiMutagen[];
}
export interface ZiweiCurrentHoroscope {
  targetDate: string; lunarDate: string; nominalAge: number;
  decadal: ZiweiHoroscopeLayer;  // 大限
  yearly: ZiweiHoroscopeLayer;   // 流年
  monthly: ZiweiHoroscopeLayer;  // 流月
  daily: ZiweiHoroscopeLayer;    // 流日
}
```

消費端：`fusion-engine.ts:449`（時運交叉比對）、`fusion-engine.ts:577`（時間軸）。

---

## 7. 喜用神／日主強弱

函式：`analyzeDayMaster(bazi: BaziResult): DayMasterAnalysis`（`src/engines/bazi-analysis-engine.ts`）

```ts
// src/engines/bazi-analysis-engine.ts:24
export interface DayMasterAnalysis {
  level: DayMasterLevel;          // 強／偏強／中和／偏弱／弱
  ratio: number;
  supportScore: number;
  opposeScore: number;
  components: StrengthComponent[];  // 計分明細
  favorable: FavorableAdvice[];     // 喜用五行 + 生活對應
  unfavorable: ElementName[];       // 忌神
  plainSummary: string;
  seasonalNote?: string;
  caveat: string;
}
```

輔助：`calculateSeasonStrength(monthBranch)`（月令旺相休囚死）、`calculateHiddenStemWeights(...)`（藏干比重）皆在 `bazi-strength-engine.ts`。

> **注意**：`DayMasterAnalysis` 定義在 engine 檔內，不在 `types/fate.ts`，且 **未寫入 `FateReportInput`**——需要喜用神時必須自行呼叫 `analyzeDayMaster(input.bazi)`。

---

## 8. 跨系統融合解讀

產生位置：`src/engines/fusion-engine.ts` 的 `generateFusionReading(input, options): FusionReading`
型別位置：`src/types/fate.ts:355–449`

```ts
export interface FusionReading {
  headline: string;
  plainIntro: string;
  systemsUsed: string[];
  consensus: FusionConsensus;   // 元素投票 + leading + agreementLevel + plainSummary + mappingNotes
  axes: FusionAxis[];           // 四條性格光譜：score / verdict / evidence
  domains: FusionDomain[];      // 個性・工作・感情・身心：plainReading / evidence / reminder
  highlights: FusionHighlight[];// kind: 'agreement' | 'tension'（矛盾亮點在此）
  timing?: FusionTiming;
  cautions: string[];
}
export interface FusionEvidence { system: string; point: string; }
export interface FusionHighlight { kind: 'agreement' | 'tension'; title: string; plainExplanation: string; systems: string[]; }
```

另有 `buildSystemMatrix(...)`（系統×面向雷達）、`generateSystemConclusions(...)`、`generateTimelineReading(...)`，以及 `integration-engine.ts` 的 `buildUnifiedElementProfile(...)`（加權五行剖面）。

> **Prompt 1 可直接取用**：`consensus`（共識）與 `highlights.filter(h => h.kind === 'tension')`（矛盾，已含 `systems` 陣列可指名系統）。

---

## 9. idb-keyval 使用情形

全部集中在 **`src/utils/storage.ts`**（唯一存取點，其他檔案不直接呼叫 idb-keyval）。

| Key | 內容 | 寫入 | 清除 |
| --- | --- | --- | --- |
| `fateverse:preferences` | `LocalPreferences`（retainAnalysis / ocrLanguage / theme） | `savePreferences` | `clearLocalData` |
| `fateverse:last-analysis` | `{ profile, report }`（**opt-in**，需 `retainAnalysis`） | `saveAnalysis` | `savePreferences`（關閉時 del）、`clearLocalData` |
| `fateverse:decision-rituals` | `RitualRecord[]`（上限 30） | `saveRitual` | `clearRituals`、`clearLocalData` |
| `fateverse:time-capsules` | `CapsuleRecord[]`（上限 60） | `saveCapsule` / `updateCapsule` / `deleteCapsule` | `clearCapsules`、`clearLocalData` |

`clearLocalData()` 呼叫 idb-keyval 的 `clear()`（清空整個 store）並刪除所有 Cache Storage，**新增 key 會自動被涵蓋**；但個別的 `clearXxx` 需自行新增。設定頁 `SettingsPage.tsx` 的「清除我的所有本地資料」呼叫 `clearLocalData()`。

**命名慣例**：`fateverse:<kebab-case-複數>`。

---

## 10. 測試檔分布與慣例

位置：專案根目錄 `tests/`（非 `src/` 內共置）。命名 `<主題>.test.ts`，含 React 渲染者用 `.test.tsx`。

```
tests/
├── setup.ts                    Vitest 全域設定
├── engines.test.ts             各引擎綜合
├── bazi-analysis.test.ts  fusion.test.ts  integration.test.ts
├── report.test.ts  data.test.ts  fortune.test.ts  tarot.test.ts
├── palm.test.ts  palm-analyzer.test.ts  narrative.test.ts
├── decision-ritual.test.ts  time-capsule.test.ts  cosmic-imprint.test.ts
├── synastry-sound.test.ts      合盤 + 聲音指紋
├── barnum.test.ts  barnum-page.test.tsx
├── share-link.test.ts  profile-helpers.test.ts  daily.test.ts
├── back-to-report.test.tsx  report-tabs.test.tsx  scroll.test.tsx
└── specificity/                文案具體性量測工具（見 docs/voice.md）
    ├── specificity.test.ts  analyze.ts  extract-sentences.ts
    ├── static-corpus.ts  synthetic-charts.ts  voice-rules.ts  write-baseline.ts
```

指令：`npm run test`（Vitest）、`npm run test:specificity`（500 命盤文案量測，約 25 秒，需 `SPECIFICITY=1`）。
目前 **217 passed / 1 skipped**。

**既有品質關卡**（新功能需一併遵守）：
- `docs/voice.md` 文案語氣規格；靜態文案違規上限為 **0**，新增含「您」、未來斷言或模糊限定詞（可能／或許／傾向於／往往／有時）的文案會導致測試失敗。
- `npm run lint` 為 `--max-warnings 0`。
- TypeScript strict。
