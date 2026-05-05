import { Component } from 'react'
import RichRendererDebugBadge from './debug/RichRendererDebugBadge.jsx'
import { logRichRendererError } from './observability/richRendererLogger.js'

class RichRendererErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    logRichRendererError(error, {
      message: this.props.message,
      renderPhase: this.props.renderPhase,
      source: 'RichRendererErrorBoundary',
      errorInfo
    })
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <>
          {this.props.fallback}
          <RichRendererDebugBadge
            message={this.props.message}
            renderPhase={this.props.renderPhase}
            renderSourcePanel={this.props.renderSourcePanel}
            fallback
          />
        </>
      )
    }

    return this.props.children
  }
}

export default RichRendererErrorBoundary
