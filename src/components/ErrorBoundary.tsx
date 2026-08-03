import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Send error to our backend telemetry endpoint
    this.logErrorToTelemetry(error, errorInfo);
  }

  private async logErrorToTelemetry(error: Error, errorInfo: ErrorInfo) {
    try {
      // Telemetry endpoint is protected by server-side schema validation + rate limiting.
      // No client-side secret is embedded in the bundle (secrets belong server-side only).
      await fetch('/api/v1/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'CLIENT_UI_ERROR',
          errorName: error.name,
          errorMessage: error.message,
          stackTrace: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        }),
      });
    } catch (e) {
      console.error('Failed to send telemetry:', e);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Ups! Terjadi Kesalahan</h1>
            <p className="text-slate-400 mb-8">
              Maaf, sistem mengalami kendala teknis saat memuat tampilan ini. Jangan khawatir, tim kami telah mencatat masalah ini.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
