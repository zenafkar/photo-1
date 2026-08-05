import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { TopUpProvider } from "./context/TopUpContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ClerkModalFix } from "./components/ClerkModalFix";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const StudioDashboard = lazy(() => import("./pages/StudioDashboard"));

const PageLoader = () => (
  <div className="min-h-[100dvh] flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ClerkModalFix />
      <ScrollToTop />
      <TopUpProvider>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/studio" element={<StudioDashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </TopUpProvider>
    </BrowserRouter>
  );
}

export default App;
