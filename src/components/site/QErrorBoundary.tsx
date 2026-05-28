import { Component, type ErrorInfo, type ReactNode } from "react";
import { QMark } from "@/components/site/QMark";

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
  message: string | null;
}

export class QErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message ?? "Unknown" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[QErrorBoundary]", error, info?.componentStack);
  }

  reset = () => this.setState({ hasError: false, message: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="fixed bottom-20 right-5 md:bottom-28 md:right-8 z-40 max-w-[320px] bg-background border border-border shadow-[0_18px_50px_-12px_rgba(0,0,0,0.4)] p-5">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2">
          {this.props.label ?? "Q"} · lost signal
        </div>
        <div className="font-display text-lg leading-snug mb-2">
          <QMark /> dropped the line.
        </div>
        <p className="font-body text-xs text-foreground/70 leading-relaxed mb-3">
          Your draft is safe. Tap retry to bring <QMark /> back.
        </p>
        <button
          type="button"
          onClick={this.reset}
          className="w-full py-2.5 bg-foreground text-background font-mono text-xs uppercase tracking-[0.25em] hover:bg-accent transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }
}
