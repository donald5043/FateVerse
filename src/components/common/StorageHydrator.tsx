import { useEffect } from 'react';
import { generateFallbackReport } from '../../ai/fallback-report';
import { useFateStore } from '../../store/useFateStore';
import { loadAnalysis, loadPreferences } from '../../utils/storage';

export default function StorageHydrator() {
  const setProfile = useFateStore((state) => state.setProfile);
  const setUiTheme = useFateStore((state) => state.setUiTheme);
  useEffect(() => {
    void Promise.all([loadPreferences(), loadAnalysis()]).then(([preferences, saved]) => {
      setUiTheme(preferences.theme);
      if (preferences.retainAnalysis && saved) setProfile(saved.profile, saved.report, generateFallbackReport(saved.report));
    }).catch(() => {
      // 儲存空間不可用時維持不保存的安全預設。
    });
  }, [setProfile, setUiTheme]);
  return null;
}
