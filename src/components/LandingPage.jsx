import DietPlanUploader from "./DietPlanUploader";
import PinnedPlanCard from "./PinnedPlanCard";

export default function LandingPage({
	handleDietPlanUpload,
	handleRemovePinnedPlan,
	pinnedPlans,
	handleLoadPinnedPlan,
	handleRenamePinnedPlan,
	handleLogout, // 👈 new prop
}) {
	return (
		<div className="max-w-3xl mx-auto relative">
			{/* Logout button */}
			<div className="absolute top-0 right-0 mt-4 mr-4">
				<button
					onClick={handleLogout}
					className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
				>
					Cerrar Sesión
				</button>
			</div>

			<div className="bg-white p-8 rounded-lg shadow-md mb-8 mt-12">
				<h2 className="text-2xl font-bold mb-6 text-center">
					Bienvenido a tu Planificador de Comidas
				</h2>
				<p className="text-gray-600 mb-8 text-center">
					Sube tu plan alimenticio en formato JSON para comenzar a planificar tus comidas semanales.
				</p>

				<DietPlanUploader onUpload={handleDietPlanUpload} />
			</div>

			{/* Pinned Plans Section */}
			{pinnedPlans.length > 0 && (
				<div className="bg-white p-8 rounded-lg shadow-md">
					<h2 className="text-xl font-bold mb-6">Planes Guardados</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{pinnedPlans.map((plan) => (
							<PinnedPlanCard
								key={plan.id}
								plan={plan}
								onLoad={handleLoadPinnedPlan}
								onRemove={handleRemovePinnedPlan}
								onRename={handleRenamePinnedPlan}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
