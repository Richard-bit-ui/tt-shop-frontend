import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { Header } from './components/Header';
import { AddedSheet, CompareBar, Footer, ScrollManager, SearchOverlay, Toast } from './components/Chrome';
import { QuickView } from './components/QuickView';
import { ChatLauncher } from './components/Chat';
import Home from './pages/Home';
import Category from './pages/Category';

import { BASE_PATH, IS_PUBLIC_PREVIEW } from './lib/asset';
const Product = lazy(() => import('./pages/Product'));
const Compare = lazy(() => import('./pages/Compare'));
const Configurator = lazy(() => import('./pages/Configurator'));
const ProSetups = lazy(() => import('./pages/ProSetups'));
const Advisor = lazy(() => import('./pages/Advisor'));
const Content = lazy(() => import('./pages/Content'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Misc = lazy(() => import('./pages/Misc'));

function PageLoader() {
  return (
    <div className="grid min-h-[100dvh] place-items-center text-muted">
      <Loader2 className="animate-spin" />
    </div>
  );
}

/** Hinweis in der öffentlichen Vorschau (GitHub Pages) */
function PreviewBar() {
  if (!IS_PUBLIC_PREVIEW) return null;
  return (
    <div className="bg-ink px-4 py-2 text-center text-[12px] leading-snug text-white/75" data-print-hide>
      <span className="font-semibold text-white">Prototyp</span> · Vorschau des neuen TT-Shop-Frontends – Bestellungen werden nicht ausgeführt.{' '}
      <a href="https://www.tt-shop.de" className="whitespace-nowrap text-white underline underline-offset-2">
        Zum Shop tt-shop.de
      </a>
    </div>
  );
}

function Shell() {
  const { pathname } = useLocation();
  const minimal = pathname.startsWith('/kasse');
  return (
    <>
      <ScrollManager />
      <a href="#inhalt" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2.5 focus:text-white">
        Zum Inhalt springen
      </a>
      <PreviewBar />
      {!minimal && <Header />}
      <main id="inhalt" tabIndex={-1} className={`min-h-[60vh] outline-none ${pathname === '/' ? '' : 'pb-16'}`}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/c/:cat" element={<Category />} />
            <Route path="/c/:cat/:sub" element={<Category />} />
            <Route path="/suche" element={<Category mode="search" />} />
            <Route path="/marke/:slug" element={<Category mode="brand" />} />
            <Route path="/marken" element={<Misc page="brands" />} />
            <Route path="/p/:id" element={<Product />} />
            <Route path="/vergleich" element={<Compare />} />
            <Route path="/konfigurator" element={<Configurator />} />
            <Route path="/profi-setups" element={<ProSetups />} />
            <Route path="/berater" element={<Advisor />} />
            <Route path="/ratgeber" element={<Content page="guides" />} />
            <Route path="/ratgeber/:slug" element={<Content page="guide" />} />
            <Route path="/glossar" element={<Content page="glossary" />} />
            <Route path="/montage" element={<Content page="assembly" />} />
            <Route path="/verein" element={<Content page="club" />} />
            <Route path="/warenkorb" element={<Cart />} />
            <Route path="/kasse" element={<Checkout />} />
            <Route path="/shop" element={<Misc page="shop" />} />
            <Route path="/merkliste" element={<Misc page="wishlist" />} />
            <Route path="/bestellung/danke" element={<Misc page="success" />} />
            <Route path="/widerruf" element={<Misc page="widerruf" />} />
            <Route path="/konto" element={<Misc page="account" />} />
            <Route path="/service" element={<Misc page="service" />} />
            <Route path="/studio" element={<Navigate to="/c/tische" replace />} />
            <Route path="*" element={<Misc page="404" />} />
          </Routes>
        </Suspense>
      </main>
      {!minimal && <Footer />}
      <CompareBar />
      <SearchOverlay />
      <AddedSheet />
      <QuickView />
      <Toast />
      <ChatLauncher />
    </>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter basename={BASE_PATH || undefined}>
        <Shell />
      </BrowserRouter>
    </MotionConfig>
  );
}
