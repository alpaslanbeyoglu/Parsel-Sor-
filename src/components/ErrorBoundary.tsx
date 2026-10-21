import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TKGM Parsel Pro React Error Boundary yakaladı:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('tkgm_parsel_pro_saved_v2');
      localStorage.removeItem('tkgm_parsel_pro_saved');
    } catch {}
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-white">Uygulama Yeniden Yükleniyor</h1>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Harita veya yerel önbellek verileri yüklenirken beklenmeyen bir durum oluştu. Tarayıcı önbelleğini temizleyip yeniden başlatabilirsiniz.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-left text-[11px] font-mono text-rose-300 overflow-x-auto max-h-24">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Yeniden Dene</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-bold text-rose-300 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Önbelleği Sıfırla</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
