import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LocalizedSite, SiteRedirect } from './site/SiteRoot.tsx';
import NewsOverviewPage from './pages/NewsOverviewPage.tsx';
import NewsDetailPage from './pages/NewsDetailPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import ThemeStyle from './components/ThemeStyle.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* ThemeStyle drives the legacy CMS dashboard's amber tokens (kept). */}
    <ThemeStyle />
    <BrowserRouter>
      <Routes>
        {/* New public site — localized */}
        <Route path="/" element={<SiteRedirect />} />
        <Route path="/:locale" element={<LocalizedSite />} />

        {/* CMS surfaces — kept working, untouched backend */}
        <Route path="/nieuws" element={<NewsOverviewPage />} />
        <Route path="/nieuws/:slug" element={<NewsDetailPage />} />
        <Route path="/beheer" element={<DashboardPage />} />

        {/* Fallback → detected locale */}
        <Route path="*" element={<SiteRedirect />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
