import { useState, useEffect } from 'react';

const EditDietPlanModal = ({ dietPlan, onSave, onCancel }) => {
    const [editedPlan, setEditedPlan] = useState({
        name: '',
        description: '',
        durationDays: 1,
        days: []
    });

    useEffect(() => {
        if (dietPlan) {
            setEditedPlan({
                name: dietPlan.name || '',
                description: dietPlan.description || '',
                durationDays: dietPlan.durationDays || dietPlan.days?.length || 1,
                days: dietPlan.days ? [...dietPlan.days] : []
            });
        }
    }, [dietPlan]);

    const handleInputChange = (field, value) => {
        setEditedPlan(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDayChange = (dayIndex, field, value) => {
        setEditedPlan(prev => {
            const newDays = [...prev.days];
            if (!newDays[dayIndex]) {
                newDays[dayIndex] = { name: '', meals: [] };
            }
            newDays[dayIndex] = {
                ...newDays[dayIndex],
                [field]: value
            };
            return {
                ...prev,
                days: newDays
            };
        });
    };

    const handleMealChange = (dayIndex, mealIndex, field, value) => {
        setEditedPlan(prev => {
            const newDays = [...prev.days];
            if (!newDays[dayIndex]) {
                newDays[dayIndex] = { name: '', meals: [] };
            }
            if (!newDays[dayIndex].meals) {
                newDays[dayIndex].meals = [];
            }
            if (!newDays[dayIndex].meals[mealIndex]) {
                newDays[dayIndex].meals[mealIndex] = { name: '', ingredients: [] };
            }
            newDays[dayIndex].meals[mealIndex] = {
                ...newDays[dayIndex].meals[mealIndex],
                [field]: value
            };
            return {
                ...prev,
                days: newDays
            };
        });
    };

    const handleIngredientChange = (dayIndex, mealIndex, ingredientIndex, field, value) => {
        setEditedPlan(prev => {
            const newDays = [...prev.days];
            if (!newDays[dayIndex]) {
                newDays[dayIndex] = { name: '', meals: [] };
            }
            if (!newDays[dayIndex].meals) {
                newDays[dayIndex].meals = [];
            }
            if (!newDays[dayIndex].meals[mealIndex]) {
                newDays[dayIndex].meals[mealIndex] = { name: '', ingredients: [] };
            }
            if (!newDays[dayIndex].meals[mealIndex].ingredients) {
                newDays[dayIndex].meals[mealIndex].ingredients = [];
            }
            if (!newDays[dayIndex].meals[mealIndex].ingredients[ingredientIndex]) {
                newDays[dayIndex].meals[mealIndex].ingredients[ingredientIndex] = { name: '', quantity: '' };
            }
            newDays[dayIndex].meals[mealIndex].ingredients[ingredientIndex] = {
                ...newDays[dayIndex].meals[mealIndex].ingredients[ingredientIndex],
                [field]: value
            };
            return {
                ...prev,
                days: newDays
            };
        });
    };

    const addMeal = (dayIndex) => {
        setEditedPlan(prev => {
            const newDays = [...prev.days];
            if (!newDays[dayIndex]) {
                newDays[dayIndex] = { name: '', meals: [] };
            }
            if (!newDays[dayIndex].meals) {
                newDays[dayIndex].meals = [];
            }
            newDays[dayIndex].meals.push({
                name: '',
                ingredients: []
            });
            return {
                ...prev,
                days: newDays
            };
        });
    };

    const removeMeal = (dayIndex, mealIndex) => {
        setEditedPlan(prev => {
            const newDays = [...prev.days];
            if (newDays[dayIndex] && newDays[dayIndex].meals) {
                newDays[dayIndex].meals.splice(mealIndex, 1);
            }
            return {
                ...prev,
                days: newDays
            };
        });
    };

    const addIngredient = (dayIndex, mealIndex) => {
        setEditedPlan(prev => {
            const newDays = [...prev.days];
            if (!newDays[dayIndex]) {
                newDays[dayIndex] = { name: '', meals: [] };
            }
            if (!newDays[dayIndex].meals) {
                newDays[dayIndex].meals = [];
            }
            if (!newDays[dayIndex].meals[mealIndex]) {
                newDays[dayIndex].meals[mealIndex] = { name: '', ingredients: [] };
            }
            if (!newDays[dayIndex].meals[mealIndex].ingredients) {
                newDays[dayIndex].meals[mealIndex].ingredients = [];
            }
            newDays[dayIndex].meals[mealIndex].ingredients.push({
                name: '',
                quantity: ''
            });
            return {
                ...prev,
                days: newDays
            };
        });
    };

    const removeIngredient = (dayIndex, mealIndex, ingredientIndex) => {
        setEditedPlan(prev => {
            const newDays = [...prev.days];
            if (newDays[dayIndex] && newDays[dayIndex].meals && newDays[dayIndex].meals[mealIndex] && newDays[dayIndex].meals[mealIndex].ingredients) {
                newDays[dayIndex].meals[mealIndex].ingredients.splice(ingredientIndex, 1);
            }
            return {
                ...prev,
                days: newDays
            };
        });
    };

    const handleSave = () => {
        // Ensure we have the correct number of days
        const finalDays = editedPlan.days.slice(0, editedPlan.durationDays);
        const finalPlan = {
            ...editedPlan,
            days: finalDays
        };
        onSave(finalPlan);
    };

    return (
        <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Información Básica</h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Plan
                    </label>
                    <input
                        type="text"
                        value={editedPlan.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Nombre del plan de dieta"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                    </label>
                    <textarea
                        value={editedPlan.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows="3"
                        placeholder="Descripción del plan de dieta"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duración (días)
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="30"
                        value={editedPlan.durationDays}
                        onChange={(e) => handleInputChange('durationDays', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Days and Meals */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Días y Comidas</h3>

                {Array.from({ length: editedPlan.durationDays }, (_, dayIndex) => (
                    <div key={dayIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Día {dayIndex + 1}
                            </label>
                            <input
                                type="text"
                                value={editedPlan.days[dayIndex]?.name || ''}
                                onChange={(e) => handleDayChange(dayIndex, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder={`Día ${dayIndex + 1}`}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <h4 className="text-md font-medium text-gray-700">Comidas</h4>
                                <button
                                    type="button"
                                    onClick={() => addMeal(dayIndex)}
                                    className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600"
                                >
                                    + Agregar Comida
                                </button>
                            </div>

                            {editedPlan.days[dayIndex]?.meals?.map((meal, mealIndex) => (
                                <div key={mealIndex} className="border border-gray-200 rounded-lg p-3">
                                    <div className="flex justify-between items-center mb-3">
                                        <h5 className="text-sm font-medium text-gray-700">Comida {mealIndex + 1}</h5>
                                        <button
                                            type="button"
                                            onClick={() => removeMeal(dayIndex, mealIndex)}
                                            className="px-2 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                                        >
                                            Eliminar
                                        </button>
                                    </div>

                                    <div className="mb-3">
                                        <input
                                            type="text"
                                            value={meal.name || ''}
                                            onChange={(e) => handleMealChange(dayIndex, mealIndex, 'name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Nombre de la comida"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <h6 className="text-sm font-medium text-gray-600">Ingredientes</h6>
                                            <button
                                                type="button"
                                                onClick={() => addIngredient(dayIndex, mealIndex)}
                                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                            >
                                                + Ingrediente
                                            </button>
                                        </div>

                                        {meal.ingredients?.map((ingredient, ingredientIndex) => (
                                            <div key={ingredientIndex} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={ingredient.name || ''}
                                                    onChange={(e) => handleIngredientChange(dayIndex, mealIndex, ingredientIndex, 'name', e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="Nombre del ingrediente"
                                                />
                                                <input
                                                    type="text"
                                                    value={ingredient.quantity || ''}
                                                    onChange={(e) => handleIngredientChange(dayIndex, mealIndex, ingredientIndex, 'quantity', e.target.value)}
                                                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="Cantidad"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeIngredient(dayIndex, mealIndex, ingredientIndex)}
                                                    className="px-2 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                    Guardar Cambios
                </button>
            </div>
        </div>
    );
};

export default EditDietPlanModal;
