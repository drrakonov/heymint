import { Component, type ReactNode } from "react";

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="session-loading" role="alert">
          <span className="brand">HeyMint.</span>
          <h1>Let’s reconnect.</h1>
          <p>This view couldn’t load. Reload the page to try again.</p>
          <button
            className="rounded-md bg-primary px-6 py-3 text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Reload HeyMint
          </button>
          <a href="/">Back to home</a>
        </main>
      );
    return this.props.children;
  }
}
