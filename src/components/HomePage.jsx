import React, { useState } from 'react';
import DietPlanUploader from './DietPlanUploader';
import DietPlanManager from './DietPlanManager';
import { useToast } from './Toast';

const HomePage = ({
    handleDietPlanUpload,
    handleRemovePinnedPlan,
    pinnedPlans,
    handleLoadPinnedPlan,
    handleRenamePinnedPlan,
    handleLogout,
    onPlanSelect,
    onPlanEdit,
    onPlanDelete,
    onPlanDuplicate,
    dietPlansRefreshTrigger
}) => {
    const [activeTab, setActiveTab] = useState('plans'); // 'plans' or 'upload'
    const toast = useToast();

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                    Plan Alimenticio
                </h1>
                <p className="text-lg text-gray-600">
                    Gestiona tus planes de dieta y crea nuevos
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
                <div className="bg-white rounded-lg shadow-md p-1">
                    <button
                        onClick={() => handleTabChange('plans')}
                        className={`px-6 py-3 rounded-md font-medium transition-colors ${activeTab === 'plans'
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        📋 Mis Planes
                    </button>
                    <button
                        onClick={() => handleTabChange('upload')}
                        className={`px-6 py-3 rounded-md font-medium transition-colors ${activeTab === 'upload'
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        📤 Subir Nuevo Plan
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-md">
                {activeTab === 'plans' ? (
                    <div className="p-6">
                        <DietPlanManager
                            onPlanSelect={onPlanSelect}
                            onPlanEdit={onPlanEdit}
                            onPlanDelete={onPlanDelete}
                            onPlanDuplicate={onPlanDuplicate}
                            dietPlansRefreshTrigger={dietPlansRefreshTrigger}
                        />
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                Subir Nuevo Plan de Dieta
                            </h2>
                            <p className="text-gray-600">
                                Sube un archivo JSON con tu plan de dieta
                            </p>
                        </div>
                        <DietPlanUploader onUpload={handleDietPlanUpload} />
                    </div>
                )}
            </div>

            {/* Legacy Pinned Plans Section (if any exist) */}
            {pinnedPlans && pinnedPlans.length > 0 && (
                <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        Planes Guardados (Legacy)
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pinnedPlans.map((plan) => (
                            <div
                                key={plan.id}
                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-gray-800">
                                        {plan.name}
                                    </h3>
                                    <button
                                        onClick={() => handleRemovePinnedPlan(plan.id)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        ×
                                    </button>
                                </div>
                                <p className="text-gray-600 text-sm mb-3">
                                    Creado: {new Date(plan.createdAt).toLocaleDateString()}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleLoadPinnedPlan(plan)}
                                        className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
                                    >
                                        Cargar
                                    </button>
                                    <button
                                        onClick={() => {
                                            const newName = prompt(
                                                'Ingresa el nuevo nombre:',
                                                plan.name
                                            );
                                            if (newName) {
                                                handleRenamePinnedPlan(plan.id, newName);
                                            }
                                        }}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                                    >
                                        Renombrar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;
