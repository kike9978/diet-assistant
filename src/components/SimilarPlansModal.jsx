import React from 'react';

const SimilarPlansModal = ({ isOpen, similarPlans, onClose, onUseExisting, onCreateNew }) => {
    if (!isOpen) return null;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getSimilarityColor = (similarity) => {
        if (similarity >= 0.95) return 'text-red-600';
        if (similarity >= 0.85) return 'text-orange-600';
        return 'text-yellow-600';
    };

    const getSimilarityText = (similarity) => {
        if (similarity >= 0.95) return 'Muy similar';
        if (similarity >= 0.85) return 'Similar';
        return 'Parcialmente similar';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                        Planes Similares Encontrados
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <p className="text-gray-600 mb-4">
                    Se encontraron planes similares al que intentas crear. Puedes usar uno existente o crear uno nuevo.
                </p>

                <div className="space-y-3 mb-6">
                    {similarPlans.map((plan) => (
                        <div
                            key={plan.id}
                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-gray-800">{plan.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        Creado: {formatDate(plan.createdAt)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-sm font-medium ${getSimilarityColor(plan.similarity)}`}>
                                        {getSimilarityText(plan.similarity)}
                                    </span>
                                    <p className="text-xs text-gray-500">
                                        {Math.round(plan.similarity * 100)}% similar
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={() => onUseExisting(similarPlans[0])}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Usar Plan Existente
                    </button>

                    <button
                        onClick={onCreateNew}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                        Crear Nuevo Plan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SimilarPlansModal;
