'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            showDetails: false
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });

        // Log error to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // TODO: Send error to error tracking service (e.g., Sentry)
        // if (typeof window !== 'undefined' && window.Sentry) {
        //     window.Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
        // }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            showDetails: false
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    toggleDetails = () => {
        this.setState(prev => ({ showDetails: !prev.showDetails }));
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-[400px] flex items-center justify-center p-6">
                    <div className="w-full max-w-lg">
                        {/* Error Card */}
                        <div className="bg-[#0a0a0a] border border-red-500/20 rounded-2xl p-8 shadow-xl">
                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                                    <AlertTriangle className="w-8 h-8 text-red-500" />
                                </div>
                            </div>

                            {/* Message */}
                            <h2 className="text-xl font-bold text-white text-center mb-2">
                                Something went wrong
                            </h2>
                            <p className="text-gray-400 text-center mb-6">
                                An unexpected error occurred. You can try refreshing or go back home.
                            </p>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                <button
                                    onClick={this.handleReload}
                                    className="flex-1 py-3 px-4 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Refresh Page
                                </button>
                                <button
                                    onClick={this.handleGoHome}
                                    className="flex-1 py-3 px-4 bg-white/5 text-white border border-white/10 font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                                >
                                    <Home className="w-4 h-4" />
                                    Go Home
                                </button>
                            </div>

                            {/* Error Details (Collapsible) */}
                            {this.state.error && (
                                <div className="border-t border-white/10 pt-4">
                                    <button
                                        onClick={this.toggleDetails}
                                        className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-400 transition-colors"
                                    >
                                        <span>Error Details</span>
                                        {this.state.showDetails ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </button>

                                    {this.state.showDetails && (
                                        <div className="mt-3 p-4 bg-red-500/5 border border-red-500/10 rounded-lg overflow-auto max-h-48">
                                            <p className="text-xs font-mono text-red-400 break-all">
                                                <strong>Error:</strong> {this.state.error.message}
                                            </p>
                                            {this.state.errorInfo?.componentStack && (
                                                <pre className="text-xs font-mono text-red-400/70 mt-2 whitespace-pre-wrap">
                                                    {this.state.errorInfo.componentStack}
                                                </pre>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Retry with Reset */}
                        <button
                            onClick={this.handleReset}
                            className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-400 transition-colors"
                        >
                            Try again without refreshing
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

// Hook version for functional components
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}
