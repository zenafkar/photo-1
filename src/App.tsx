import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TopUpProvider } from "./context/TopUpContext";

// Lazy loading pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const StudioDashboard = lazy(() => import("./pages/StudioDashboard"));

// Loading fallback yang ringan
const PageLoader = () => (
  <div className="min-h-[100dvh] flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <TopUpProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/studio" element={<StudioDashboard />} />
          </Routes>
        </Suspense>
      </TopUpProvider>
    </BrowserRouter>
  );
}

export default App;
