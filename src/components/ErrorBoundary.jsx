import React from 'react';

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null, errorInfo: null };
	}

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch(error, errorInfo) {
		this.setState({
			error,
			errorInfo,
		});

		// Log error to console for development
		console.error('ErrorBoundary caught an error:', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen flex items-center justify-center bg-gray-100">
					<div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
						<div className="text-red-500 mb-4">
													<svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
						</div>
						<h2 className="text-xl font-bold text-gray-800 mb-4">Oops! Algo salió mal</h2>
						<p className="text-gray-600 mb-6">
							Ha ocurrido un error inesperado. Por favor, recarga la página para continuar.
						</p>
											<button
						type="button"
						onClick={() => window.location.reload()}
						className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition-colors"
					>
						Recargar página
					</button>
											{process.env.NODE_ENV === 'development' && this.state.error && (
						<details className="mt-6 text-left">
							<summary className="cursor-pointer text-sm text-gray-500">Detalles del error (desarrollo)</summary>
							<pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
								{this.state.error?.toString()}
								<br />
								{this.state.errorInfo?.componentStack}
							</pre>
						</details>
					)}
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
