export type ElementName = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export interface DataSource {
  sourceName: string;
  sourceUrl?: string;
  license?: string;
  notes?: string;
}

export interface FortuneStick {
  id: string;
  system: 'sixty-jiazi' | 'guanyin-100' | 'custom';
  sourceName: string;
  number: number;
  title?: string;
  level: string;
  poem: string[];
  story?: string;
  summary: string;
  interpretations: {
    overall: string;
    career?: string;
    jobChange?: string;
    love?: string;
    wealth?: string;
    family?: string;
    health?: string;
    study?: string;
    travel?: string;
  };
  actions: string[];
  risks: string[];
  keywords: string[];
  dataSource: DataSource;
}

export type FortuneTopic =
  | 'overall'
  | 'career'
  | 'jobChange'
  | 'love'
  | 'wealth'
  | 'family'
  | 'health'
  | 'study'
  | 'travel'
  | 'custom';

export interface BaziPillar {
  label: string;
  value: string;
  stem: string;
  branch: string;
  stemElement: ElementName;
  branchElement: ElementName;
  naYin: string;
  tenGod: string;
  hiddenStems: string[];
  hiddenTenGods: string[];
  lifeStage: string;
  xunKong: string;
}

export interface BaziLuckCycle {
  ganZhi: string;
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
}

export interface BaziResult {
  solarDate: string;
  lunarDate: string;
  pillars: BaziPillar[];
  dayMaster: string;
  dayMasterElement: ElementName;
  zodiac: string;
  seasonalNode: string;
  taiYuan: string;
  taiXi: string;
  mingGong: string;
  shenGong: string;
  luckCycles?: BaziLuckCycle[];
  luckStart?: {
    direction: 'forward' | 'backward';
    years: number;
    months: number;
    days: number;
    startDate: string;
  };
  timezone: string;
  trueSolarTimeApplied: false;
}

export interface FiveElementResult {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
  total: number;
  percentages: Record<ElementName, number>;
  strongest: ElementName[];
  weakest: ElementName[];
}

export interface ZodiacResult {
  animal: string;
  branch: string;
  symbol: string;
  positiveTraits: string[];
  blindSpots: string[];
}

export interface PlanetPosition {
  name: string;
  longitude: number;
  sign: string;
  degreeInSign: number;
  latitude: number;
  retrograde: boolean;
  house?: number;
}

export interface HousePosition {
  house: number;
  cusp: number;
}

export interface AspectResult {
  first: string;
  second: string;
  type: string;
  orb: number;
  angle: number;
}

export interface AstrologyResult {
  sunSign: string;
  element: string;
  modality: string;
  description: string;
  strengths: string[];
  blindSpots: string[];
  moonSign?: string;
  risingSign?: string;
  planets?: PlanetPosition[];
  houses?: HousePosition[];
  aspects?: AspectResult[];
  calculatedAtUtc?: string;
  calculationLevel?: 'sun-only' | 'planetary';
  source?: DataSource;
  houseSystem?: 'equal';
}

export interface ZiweiStar {
  name: string;
  type: string;
  brightness?: string;
  mutagen?: string;
}

export interface ZiweiPalace {
  index: number;
  name: string;
  heavenlyStem: string;
  earthlyBranch: string;
  isBodyPalace: boolean;
  isOriginalPalace: boolean;
  majorStars: ZiweiStar[];
  minorStars: ZiweiStar[];
  changsheng12: string;
  decadalRange: [number, number];
}

export interface ZiweiResult {
  solarDate: string;
  lunarDate: string;
  time: string;
  timeRange: string;
  soul: string;
  body: string;
  fiveElementsClass: string;
  soulPalaceBranch: string;
  bodyPalaceBranch: string;
  palaces: ZiweiPalace[];
  calculationNote: string;
  source: DataSource;
}

export interface NumerologyResult {
  birthDateDigits: number[];
  calculationSteps: number[];
  lifePathNumber: number;
  isMasterNumber: boolean;
  title: string;
  strengths: string[];
  challenges: string[];
  description: string;
}

export type StrokeDataStatus = 'formal' | 'insufficient' | 'modern' | 'manual';

export interface NameCharacterResult {
  character: string;
  meaning?: string;
  sound?: string;
  element?: ElementName;
  strokes?: number;
  strokeSource: StrokeDataStatus;
}

export interface NameAnalysisResult {
  fullName: string;
  characterCount: number;
  characters: NameCharacterResult[];
  overallImpression: string;
  elementComparison: string;
  strokeNotice: string;
  fiveGridBeta: true;
}

export interface ProfileInput {
  name: string;
  birthDate: string;
  birthTime: string;
  gender: 'female' | 'male' | 'other';
  region: string;
  timezone: string;
  city?: string;
  longitude?: number;
  latitude?: number;
  focus: string[];
}

export interface FateReportInput {
  userFocus: string[];
  bazi: BaziResult;
  fiveElements: FiveElementResult;
  zodiac: ZodiacResult;
  astrology: AstrologyResult;
  ziwei?: ZiweiResult;
  numerology: NumerologyResult;
  nameAnalysis?: NameAnalysisResult;
}

export interface AiFateReport {
  summary: string;
  sharedPatterns: string[];
  differences: string[];
  sections: {
    bazi: string;
    zodiac: string;
    astrology: string;
    ziwei?: string;
    numerology: string;
    name?: string;
  };
  focusAnalysis: {
    topic: string;
    analysis: string;
    suggestions: string[];
  }[];
  cautions: string[];
  mode: 'ai' | 'template';
}

export interface DailyGuidanceCard {
  id: string;
  title: string;
  keyword: string;
  message: string;
  reflectionQuestion: string;
  suggestedAction: string;
}

export interface LocalModelOption {
  id: string;
  name: string;
  approximateSize: string;
  recommendedMemory: string;
  description: string;
}
