import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ padding: '3rem', maxWidth: '480px' }}>
          <div className="card">
            <h1 style={{ fontFamily: 'var(--font-serif)', marginBottom: '0.5rem', color: 'var(--error)' }}>
              Something went wrong
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
              The page could not load. Try refreshing. If the problem continues, make sure the backend is running at http://localhost:5000.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => window.location.reload()}
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
