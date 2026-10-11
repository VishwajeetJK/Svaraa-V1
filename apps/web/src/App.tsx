import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './lib/store';
import { ShellLayout } from './components/ShellLayout';
import { WalkthroughBot } from './components/walkthrough/WalkthroughBot';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { TodayPage } from './pages/TodayPage';
import { TalkPage } from './pages/TalkPage';
import { RecallPage } from './pages/RecallPage';
import { TodoPage } from './pages/TodoPage';
import { RemindersPage } from './pages/RemindersPage';
import { SafetyPage } from './pages/SafetyPage';
import { IncidentPage } from './pages/IncidentPage';
import { PendantPage } from './pages/PendantPage';
import { FamilyPage } from './pages/FamilyPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { RecitePage } from './pages/RecitePage';
import { MusicPage } from './pages/MusicPage';
import { NewsPage } from './pages/NewsPage';
import { RoutinesPage } from './pages/RoutinesPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { PrayerPage } from './pages/PrayerPage';
import { SettingsPage } from './pages/SettingsPage';
import { SimpleModePage } from './pages/SimpleModePage';
import { AlertsPage } from './pages/AlertsPage';

export function App() {
  const { session, simpleMode } = useApp();

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={session?.tenantId ? <Navigate to={simpleMode ? '/simple' : '/today'} replace /> : <LandingPage />}
        />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/demo" element={<LandingPage />} />
        <Route element={<ShellLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/talk" element={<TalkPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/recall" element={<RecallPage />} />
          <Route path="/todo" element={<TodoPage />} />
          <Route path="/reminders" element={<RemindersPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/incident/:id" element={<IncidentPage />} />
          <Route path="/pendant" element={<PendantPage />} />
          <Route path="/family" element={<FamilyPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/recite" element={<RecitePage />} />
          <Route path="/music" element={<MusicPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/routines" element={<RoutinesPage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          <Route path="/prayer" element={<PrayerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/health" element={<SettingsPage />} />
          <Route path="/calendar" element={<ConnectionsPage />} />
          <Route path="/about" element={<SettingsPage />} />
        </Route>
        <Route path="/simple" element={<SimpleModePage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <WalkthroughBot />
    </>
  );
}
