import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Top-level render-phase safety net. Callback-based errors (upload
 * decode, shader bake, export) already have their own try/catch and
 * surface as inline UI state — this only catches synchronous throws
 * during React's render, which would otherwise blank the whole page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Ratinho crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-neutral-100">
        <div className="max-w-md rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 text-center">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Ratinho hit an unexpected error and can't continue safely. Nothing you uploaded left your browser.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-400"
          >
            Reload page
          </button>
          <details className="mt-4 text-left text-xs text-neutral-500">
            <summary className="cursor-pointer select-none">Error details</summary>
            <p className="mt-2 select-text whitespace-pre-wrap break-words font-mono">{this.state.error.message}</p>
          </details>
        </div>
      </div>
    );
  }
}
