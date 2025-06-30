'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorFallback } from './error-fallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // You can log the error to an error reporting service here
    // For example: logErrorToService(error, errorInfo);
  }

  private resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback UI or use the provided one
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use the custom error fallback with reset functionality
      return (
        <ErrorFallback error={this.state.error} resetError={this.resetError} />
      );
    }

    return this.props.children;
  }
}
