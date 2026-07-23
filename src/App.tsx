import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import LoadingScreen from './components/common/LoadingScreen';
import StorageHydrator from './components/common/StorageHydrator';
import PwaUpdatePrompt from './components/common/PwaUpdatePrompt';
import AppErrorBoundary from './components/common/AppErrorBoundary';
import NetworkStatus from './components/common/NetworkStatus';

const HomePage = lazy(() => import('./pages/HomePage'));
const FortunePage = lazy(() => import('./pages/FortunePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const DailyPage = lazy(() => import('./pages/DailyPage'));
const TarotPage = lazy(() => import('./pages/TarotPage'));
const PalmPage = lazy(() => import('./pages/PalmPage'));
const BarnumMirrorPage = lazy(() => import('./pages/BarnumMirrorPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

export default function App() {
  return (
    <><StorageHydrator /><PwaUpdatePrompt /><NetworkStatus /><AppErrorBoundary><Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="fortune" element={<FortunePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="daily" element={<DailyPage />} />
          <Route path="tarot" element={<TarotPage />} />
          <Route path="palm" element={<PalmPage />} />
          <Route path="mirror" element={<BarnumMirrorPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense></AppErrorBoundary></>
  );
}
