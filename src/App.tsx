import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';

const HomePage = lazy(() => import('./pages/HomePage'));
const ChartPage = lazy(() => import('./pages/ChartPage'));
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'));
const RecommendationPage = lazy(() => import('./pages/RecommendationPage'));
const ProfilesPage = lazy(() => import('./pages/ProfilesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ExpertPage = lazy(() => import('./pages/ExpertPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

export default function App() {
  return <BrowserRouter><Suspense fallback={<div className="route-loading">正在加载页面……</div>}><Routes><Route element={<Layout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/chart" element={<ChartPage />} />
    <Route path="/analysis" element={<AnalysisPage />} />
    <Route path="/recommendation" element={<RecommendationPage />} />
    <Route path="/profiles" element={<ProfilesPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/expert" element={<ExpertPage />} />
    <Route path="/about" element={<AboutPage />} />
  </Route></Routes></Suspense></BrowserRouter>;
}
