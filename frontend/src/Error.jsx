import React from 'react'

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            error: null,
            errorInfo: null,
        }
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error,
            errorInfo,
        })
    }

    render() {
        if (this.state.errorInfo) {
            return (
                <div className="mx-auto">
                    <h2>Something went wrong.</h2>
                    <details className="errorMessage-error">
                        {this.state.error && this.state.error.toString()}
                    </details>
                    <details className="errorMessage-stack">
                        {this.state.errorInfo.componentStack}
                    </details>
                </div>
            )
        }
        return this.props.children
    }
}
