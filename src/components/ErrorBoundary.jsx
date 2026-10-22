import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-7xl mb-6">💥</div>
            <h1 className="font-display text-4xl text-white mb-3">SOMETHING BROKE</h1>
            <p className="text-zinc-400 mb-6 text-sm">{this.state.error?.message || "An unexpected error occurred."}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/"; }}
              className="btn-primary"
            >
              Go back home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
