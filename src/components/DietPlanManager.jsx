import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useToast } from './Toast';

const DietPlanManager = ({ onPlanSelect, onPlanEdit, onPlanDelete, onPlanDuplicate, dietPlansRefreshTrigger }) => {
    console.log('🔍 Debug - DietPlanManager rendered with props:', {
        dietPlansRefreshTrigger,
        hasOnPlanSelect: !!onPlanSelect,
        hasOnPlanEdit: !!onPlanEdit,
        hasOnPlanDelete: !!onPlanDelete,
        hasOnPlanDuplicate: !!onPlanDuplicate
    });

    const [dietPlans, setDietPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const { fetchAllDietPlans, duplicateDietPlan } = useApi();
    const toast = useToast();

    useEffect(() => {
        loadDietPlans();
    }, []);

    // Reload diet plans when refresh trigger changes
    useEffect(() => {
        console.log('🔍 Debug - DietPlanManager useEffect triggered, dietPlansRefreshTrigger:', dietPlansRefreshTrigger);
        if (dietPlansRefreshTrigger > 0) {
            console.log('🔍 Debug - Triggering loadDietPlans()');
            loadDietPlans();
        }
    }, [dietPlansRefreshTrigger]);

    const loadDietPlans = async () => {
        console.log('🔍 Debug - loadDietPlans() called');
        try {
            setLoading(true);
            const response = await fetchAllDietPlans();
            console.log('🔍 Debug - fetchAllDietPlans response:', response);

            if (response && response.success && response.dietPlans) {
                console.log('🔍 Debug - Setting diet plans:', response.dietPlans);
                setDietPlans(response.dietPlans);
            } else {
                console.log('🔍 Debug - No diet plans found, setting empty array');
                setDietPlans([]);
            }
        } catch (error) {
            console.error('Error loading diet plans:', error);
            toast.error('Error loading diet plans');
            setDietPlans([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        onPlanSelect(plan);
    };

    const handlePlanEdit = (plan) => {
        onPlanEdit(plan);
    };

    const handlePlanDelete = async (plan) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar "${plan.name}"?`)) {
            try {
                // Call the parent's delete handler instead of doing API call here
                await onPlanDelete(plan);
                // The parent will handle the API call and refresh trigger
            } catch (error) {
                console.error('Error deleting diet plan:', error);
                toast.error('Error al eliminar el plan de dieta');
            }
        }
    };

    const handlePlanDuplicate = async (plan) => {
        try {
            const response = await duplicateDietPlan(plan.id);
            if (response.success) {
                toast.success('Diet plan duplicated successfully');
                loadDietPlans(); // Reload the list
                onPlanDuplicate(plan, response.newPlanId);
            }
        } catch (error) {
            console.error('Error duplicating diet plan:', error);
            toast.error('Error duplicating diet plan');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Mis Planes de Dieta</h2>

            {dietPlans.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500 text-lg">No tienes planes de dieta guardados</p>
                    <p className="text-gray-400 text-sm mt-2">Sube tu primer plan de dieta para comenzar</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {dietPlans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${selectedPlan?.id === plan.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                        {plan.name}
                                    </h3>
                                    {plan.description && (
                                        <p className="text-gray-600 text-sm mb-2">
                                            {plan.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span>📅 {plan.duration_days} días</span>
                                        <span>🕒 {formatDate(plan.created_at)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handlePlanSelect(plan)}
                                        className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedPlan?.id === plan.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {selectedPlan?.id === plan.id ? 'Activo' : 'Usar'}
                                    </button>

                                    <button
                                        onClick={() => handlePlanEdit(plan)}
                                        className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        onClick={() => handlePlanDuplicate(plan)}
                                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                                    >
                                        Duplicar
                                    </button>

                                    <button
                                        onClick={() => handlePlanDelete(plan)}
                                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DietPlanManager;
