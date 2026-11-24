import { Component } from 'react';
import styles from './ErrorBoundary.module.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.wrapper} role="alert">
          <div className={styles.card}>
            <div className={styles.icon}>!</div>
            <h1 className={styles.title}>Something went wrong</h1>
            <p className={styles.message}>{this.state.errorMessage}</p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
              <a href="/" className={styles.secondaryBtn}>
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
