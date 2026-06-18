import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import NewsOverviewPage from './pages/NewsOverviewPage.tsx';
import NewsDetailPage from './pages/NewsDetailPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Existing landing page — unchanged */}
        <Route path="/" element={<App />} />
        {/* News module */}
        <Route path="/nieuws" element={<NewsOverviewPage />} />
        <Route path="/nieuws/:slug" element={<NewsDetailPage />} />
        {/* AI-CMS dashboard (scaffold) */}
        <Route path="/beheer" element={<DashboardPage />} />
        {/* Fallback → home */}
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
