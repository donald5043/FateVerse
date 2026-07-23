import { create } from 'zustand';
import type { AiFateReport, ElementName, FateReportInput, FortuneStick, FortuneTopic, ProfileInput } from '../types/fate';

export interface ModelState {
  supported: boolean | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  progress: number;
  message: string;
  error?: string;
}

interface FateState {
  profileInput?: ProfileInput;
  reportInput?: FateReportInput;
  report?: AiFateReport;
  ocrText: string;
  selectedFortune?: FortuneStick;
  fortuneTopic: FortuneTopic;
  customQuestion: string;
  model: ModelState;
  uiTheme: 'dark' | 'system';
  palmElement?: ElementName;
  setPalmElement: (palmElement?: ElementName) => void;
  setProfile: (profileInput: ProfileInput, reportInput: FateReportInput, report: AiFateReport) => void;
  setReportData: (reportInput: FateReportInput, report: AiFateReport) => void;
  setReport: (report: AiFateReport) => void;
  setOcrText: (ocrText: string) => void;
  selectFortune: (selectedFortune?: FortuneStick) => void;
  setFortuneTopic: (fortuneTopic: FortuneTopic) => void;
  setCustomQuestion: (customQuestion: string) => void;
  setModel: (next: Partial<ModelState>) => void;
  setUiTheme: (uiTheme: 'dark' | 'system') => void;
  clearSession: () => void;
}

const initialModel: ModelState = { supported: null, status: 'idle', progress: 0, message: '尚未啟用' };

export const useFateStore = create<FateState>((set) => ({
  ocrText: '',
  fortuneTopic: 'overall',
  customQuestion: '',
  model: initialModel,
  uiTheme: 'dark',
  setPalmElement: (palmElement) => set({ palmElement }),
  setProfile: (profileInput, reportInput, report) => set({ profileInput, reportInput, report }),
  setReportData: (reportInput, report) => set({ reportInput, report }),
  setReport: (report) => set({ report }),
  setOcrText: (ocrText) => set({ ocrText }),
  selectFortune: (selectedFortune) => set({ selectedFortune }),
  setFortuneTopic: (fortuneTopic) => set({ fortuneTopic }),
  setCustomQuestion: (customQuestion) => set({ customQuestion }),
  setModel: (next) => set((state) => ({ model: { ...state.model, ...next } })),
  setUiTheme: (uiTheme) => set({ uiTheme }),
  clearSession: () => set({ profileInput: undefined, reportInput: undefined, report: undefined, ocrText: '', selectedFortune: undefined, fortuneTopic: 'overall', customQuestion: '', palmElement: undefined, model: initialModel }),
}));
