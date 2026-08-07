import { Component } from 'react'

// Without a boundary, any component error unmounts the whole tree and the site
// renders as a blank page with no clue as to what happened — which is exactly
// how a missing import in AgentPipeline surfaced.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[Bitzen] erro em', this.props.label || 'componente', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="p-6 text-center">
        <p className="text-red-400 text-sm font-medium">
          Algo falhou {this.props.label ? `em ${this.props.label}` : 'nesta secção'}.
        </p>
        <p className="text-gray-500 text-xs mt-1">
          O resto do site continua a funcionar. Detalhe na consola do navegador.
        </p>
        <p className="text-gray-600 text-[11px] mt-3 font-mono break-all">
          {String(this.state.error?.message || this.state.error)}
        </p>
        <button
          onClick={() => this.setState({ error: null })}
          className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 transition-opacity"
        >
          Tentar novamente
        </button>
      </div>
    )
  }
}
