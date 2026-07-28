import React from 'react'
import { CrashScreen } from './CrashScreen'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo })
    // eslint-disable-next-line no-console
    console.error('App crashed:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <CrashScreen error={this.state.error} errorInfo={this.state.errorInfo || undefined} />
    }

    return this.props.children
  }
}
