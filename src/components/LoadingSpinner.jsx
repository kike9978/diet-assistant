export default function LoadingSpinner({ message = "Cargando..." }) {
	return (
		<div className="flex flex-col items-center justify-center p-4 h-screen">
			<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
			<p className="mt-4 text-gray-600">{message}</p>
		</div>
	);
}
