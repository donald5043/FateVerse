import { create } from 'zustand';
import type { AiFateReport, ElementName, FateReportInput, FortuneStick, FortuneTopic, ProfileInput } from '../types/fate';

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
  setPalmElement: (palmElement?: ElementName) => void;
  setProfile: (profileInput: ProfileInput, reportInput: FateReportInput, report: AiFateReport) => void;
  setReportData: (reportInput: FateReportInput, report: AiFateReport) => void;
  setReport: (report: AiFateReport) => void;
  setOcrText: (ocrText: string) => void;
  selectFortune: (selectedFortune?: FortuneStick) => void;
  setFortuneTopic: (fortuneTopic: FortuneTopic) => void;
  setCustomQuestion: (customQuestion: string) => void;
  setUiTheme: (uiTheme: 'dark' | 'system') => void;
  clearSession: () => void;
}

export const useFateStore = create<FateState>((set) => ({
  ocrText: '',
  fortuneTopic: 'overall',
  customQuestion: '',
  uiTheme: 'dark',
  setPalmElement: (palmElement) => set({ palmElement }),
  setProfile: (profileInput, reportInput, report) => set({ profileInput, reportInput, report }),
  setReportData: (reportInput, report) => set({ reportInput, report }),
  setReport: (report) => set({ report }),
  setOcrText: (ocrText) => set({ ocrText }),
  selectFortune: (selectedFortune) => set({ selectedFortune }),
  setFortuneTopic: (fortuneTopic) => set({ fortuneTopic }),
  setCustomQuestion: (customQuestion) => set({ customQuestion }),
  setUiTheme: (uiTheme) => set({ uiTheme }),
  clearSession: () => set({ profileInput: undefined, reportInput: undefined, report: undefined, ocrText: '', selectedFortune: undefined, fortuneTopic: 'overall', customQuestion: '', palmElement: undefined }),
}));
