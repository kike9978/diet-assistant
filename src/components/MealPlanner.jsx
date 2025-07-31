import { useState, useEffect } from 'react';
import { PlusIcon, DuplicateIcon } from './Icons';
import ToolsSidebar from './ToolsSidebar';
import FullDayPlanMealAccordion from './ui/FullDayPlanMealAccordion';
import { useToast } from './Toast';

function MealPlanner({ dietPlan, weekPlan, setWeekPlan, setDietPlan }) {
  const toast = useToast();
  const [selectedDay, setSelectedDay] = useState('monday');
  const [expandedDayId, setExpandedDayId] = useState(null);
  const [isDayPlanCollapsed, setIsDayPlanCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [substitutionModal, setSubstitutionModal] = useState({
    isOpen: false,
    day: '',
    mealIndex: 0,
    ingredientIndex: 0,
    ingredientName: '',
    ingredientQuantity: '',
    mealName: '',
    dayPlanId: '',
    selectedReplacement: ''
  });

  // Categorías para el ToolsSidebar
  const categories = {
    'Verduras': ['lechuga', 'tomate', 'cebolla', 'zanahoria', 'espinaca', 'pepino', 'pimiento'],
    'Alimentos de origen animal': ['pollo', 'res', 'cerdo', 'pescado', 'atún', 'salmón', 'huevo'],
    'Frutas': ['manzana', 'plátano', 'naranja', 'uva', 'fresa', 'piña', 'mango'],
    'Cereales y tubérculos': ['arroz', 'pasta', 'pan', 'avena', 'quinoa', 'papa', 'camote'],
    'Leguminosas': ['frijol', 'lenteja', 'garbanzo', 'haba', 'soya'],
    'Aceites y grasas (sin proteína)': ['aceite de oliva', 'aceite vegetal', 'mantequilla'],
    'Aceites y grasas (con proteína)': ['almendra', 'nuez', 'cacahuate', 'avellana', 'pistacho']
  };

  const otherCategoryName = 'Otros ingredientes';

  // Initialize weekPlan with empty arrays for each day if not already set
  const ensureWeekPlanStructure = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const initializedWeekPlan = { ...weekPlan };

    days.forEach(day => {
      if (!initializedWeekPlan[day]) {
        initializedWeekPlan[day] = [];
      }
    });

    return initializedWeekPlan;
  };

  // Make sure weekPlan has the proper structure
  const structuredWeekPlan = ensureWeekPlanStructure();

  const handleAddDayPlan = (dayPlan) => {
    // Replace the selected day's meals with the selected day plan
    const updatedWeekPlan = { ...structuredWeekPlan };
    updatedWeekPlan[selectedDay] = dayPlan.meals;
    setWeekPlan(updatedWeekPlan);
  };

  const handleClearDay = (dayId) => {
    const updatedWeekPlan = { ...structuredWeekPlan };
    updatedWeekPlan[dayId] = [];
    setWeekPlan(updatedWeekPlan);
  };

  const toggleDayExpansion = (dayId) => {
    setExpandedDayId(expandedDayId === dayId ? null : dayId);
  };

  // Función para manejar la adición de un nuevo ingrediente
  const handleAddIngredient = (newIngredient) => {
    if (!structuredWeekPlan[selectedDay] || structuredWeekPlan[selectedDay].length === 0) {
      // Si no hay comidas en el día seleccionado, crear una nueva comida
      const updatedWeekPlan = { ...structuredWeekPlan };
      updatedWeekPlan[selectedDay] = [{
        id: `custom-meal-${Date.now()}`,
        name: 'Comida personalizada',
        ingredients: [{
          name: newIngredient.name,
          quantity: newIngredient.quantity
        }]
      }];
      setWeekPlan(updatedWeekPlan);
    } else {
      // Agregar el ingrediente a la primera comida del día
      const updatedWeekPlan = { ...structuredWeekPlan };
      updatedWeekPlan[selectedDay][0].ingredients.push({
        name: newIngredient.name,
        quantity: newIngredient.quantity
      });
      setWeekPlan(updatedWeekPlan);
    }
  };

  // Función para abrir el modal de sustitución
  const openSubstitutionModal = (dayPlanId, mealIndex, ingredientIndex, ingredientName, ingredientQuantity, mealName) => {
    setSubstitutionModal({
      isOpen: true,
      dayPlanId,
      mealIndex,
      ingredientIndex,
      ingredientName,
      ingredientQuantity,
      mealName,
      selectedReplacement: ''
    });
  };

  // Función para cerrar el modal de sustitución
  const closeSubstitutionModal = () => {
    setSubstitutionModal({
      isOpen: false,
      day: '',
      mealIndex: 0,
      ingredientIndex: 0,
      ingredientName: '',
      ingredientQuantity: '',
      mealName: '',
      dayPlanId: '',
      selectedReplacement: ''
    });
  };

  // Función para determinar la categoría de un ingrediente
  const getIngredientCategory = (ingredientName) => {
    const lowerName = ingredientName.toLowerCase();

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
        return category;
      }
    }

    return otherCategoryName;
  };

  // Función para manejar la sustitución de un ingrediente
  const handleSubstituteIngredient = (substitution) => {
    const { day, mealIndex, ingredientIndex, replacement } = substitution;

    // Extraer el nombre y la cantidad del ingrediente del texto de reemplazo
    const parts = replacement.split(' de ');
    const quantity = parts[0];
    const name = parts.slice(1).join(' de '); // Por si hay más de un "de" en el nombre

    // Actualizar el weekPlan directamente
    const updatedWeekPlan = JSON.parse(JSON.stringify(structuredWeekPlan));

    // Buscar si algún día del weekPlan está usando el plan que estamos modificando
    Object.keys(updatedWeekPlan).forEach(weekDay => {
      // Si el día tiene comidas y la comida que estamos modificando existe
      if (updatedWeekPlan[weekDay] &&
        updatedWeekPlan[weekDay][mealIndex] &&
        updatedWeekPlan[weekDay][mealIndex].ingredients &&
        updatedWeekPlan[weekDay][mealIndex].ingredients[ingredientIndex]) {

        // Verificar si este día está usando el plan que estamos modificando
        // Comparamos el nombre del ingrediente y la cantidad para identificarlo
        const currentIngredient = updatedWeekPlan[weekDay][mealIndex].ingredients[ingredientIndex];

        if (currentIngredient.name === substitutionModal.ingredientName &&
          currentIngredient.quantity === substitutionModal.ingredientQuantity) {

          // Actualizar el ingrediente en el weekPlan
          updatedWeekPlan[weekDay][mealIndex].ingredients[ingredientIndex] = {
            name: name,
            quantity: quantity
          };
        }
      }
    });

    // Actualizar el estado del weekPlan
    setWeekPlan(updatedWeekPlan);

    // Cerrar el modal
    closeSubstitutionModal();

    // Mostrar un mensaje de éxito
    toast.success(`Ingrediente sustituido: ${substitutionModal.ingredientName} por ${name}`);
  };

  const days = [
    { id: 'monday', name: 'Lunes' },
    { id: 'tuesday', name: 'Martes' },
    { id: 'wednesday', name: 'Miércoles' },
    { id: 'thursday', name: 'Jueves' },
    { id: 'friday', name: 'Viernes' },
    { id: 'saturday', name: 'Sábado' },
    { id: 'sunday', name: 'Domingo' },
  ];

  // Mapa de equivalencias por categoría
  const equivalentsByCategory = {
    "Verduras": [
      "1 1/2 tza de apio", "1/4 tza de betabel", "1 tza de brócoli", "1 pza de calabacita",
      "1/2 tza de cebolla", "1/2 tza de champifión", "1/2 pza de chayote", "1/4 tza de chicharos",
      "2 tzas de coliflor", "2 tzas de espinacas", "1/2 tza de jícama", "1 pza de jitomate",
      "2 pzas de nopal", "1 tza de pepino", "1 tza de pimiento", "1 tza de rábano",
      "1/2 tza de zanahoria", "4 pzas de mini zanahorias", "2 tzas de lechuga",
      "3 pzas de col de bruselas", "6 pzas de espárragos"
    ],
    "Alimentos de origen animal": [
      "30 gr de carne de res", "35 gr de salmón", "30 gr de atún fresco", "1/3 lata de atún en conserva",
      "1/2 pza de chuleta", "2 pzas de clara de huevo", "75 gr de pescado fileteado", "35 gr de pollo sin piel",
      "2 reb de jamón de pavo", "50 gr de queso cottage", "40 gr de queso panela", "1 pza de huevo entera"
    ],
    "Frutas": [
      "1/2 tza de arándano", "7 pzas de ciruela pasa", "2 pzas de durazno", "1 tza de fresas",
      "3 pzas de guayaba", "2 pzas de mandarina", "1 pza de mango", "1 pza de manzana",
      "1/2 pza de pera", "1 pza de toronja", "18 pzas de uvas", "1 reb de piña",
      "1 tza de sandía", "1/4 tza de blueberries", "2 pzas de kiwi"
    ],
    "Cereales y tubérculos": [
      "1/4 tza de arroz cocido", "1/2 tza de avena", "1/3 pza de camote", "1/3 tza de pasta cocida",
      "1 paq de galletas horneadas \"Salmas\"", "2 1/2 tza de palomitas naturales", "3 cdas de granola baja en grasa",
      "20 gr de quinoa", "1 reb de pan integral", "1/2 pza de papa", "2 pzas de tortilla de nopal"
    ],
    "Leguminosas": [
      "1/2 tza de frijol cocido", "1/2 tza de garbanzo cocido", "1/2 tza de lenteja cocida",
      "1/3 tza de soya cocida", "5 cdas de hummus"
    ],
    "Leche": [
      "1 tza de leche descremada", "1 tza de yogurt bajo en grasa sin azúcar",
      "1/4 tza de yogurt griego sin azúcar", "1 tza de bebida de soya (leche de soya)"
    ],
    "Aceites y grasas (sin proteína)": [
      "1 cda de aceite", "1 cda de aceite de oliva", "1/3 pza de aguacate", "3 cdas de aderezo",
      "1 cda de crema", "1 cda de mantequilla", "1/4 cda de vinagreta"
    ],
    "Aceites y grasas (con proteína)": [
      "10 pzas de almendras", "14 pzas de cacahuate", "18 pzas de pistache", "3 pzas de nuez",
      "8 pzas de avellana", "2 cdas de mantequilla de maní", "1 tza de bebida de almendra (leche de almendra)"
    ]
  };

  return (
    <div className="h-full flex flex-col">
      {/* Day selection tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {days.map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${selectedDay === day.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {day.name}
            </button>
          ))}
        </div>
      </div>

      {/* Meal selection */}
      <div className="md:grid grid-cols-1 md:grid-cols-2 flex flex-col gap-6 flex-grow">
        {/* Available day plans */}
        <div className='flex flex-col'>
          <h3 className="text-lg font-medium mb-3">Planes de Comida Disponibles:</h3>
          <div className="bg-gray-50 p-4 rounded-md overflow-y-auto flex-grow">
            {(() => {
              // Get the days array - handle both dietPlan.days and direct array
              const days = dietPlan?.days || (Array.isArray(dietPlan) ? dietPlan : null);

              if (!days?.length) {
                return (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No hay planes de comida disponibles.</p>
                  </div>
                );
              }

              return days.map((day) => (
                <div key={day.id} className="mb-4 bg-white rounded-md shadow-sm overflow-hidden">
                  <div
                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleDayExpansion(day.id)}
                  >
                    <h4 className="font-medium text-indigo-600">{day.name}</h4>
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddDayPlan(day);
                        }}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm font-medium mr-3"
                      >
                        Usar este plan
                      </button>
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedDayId === day.id ? 'transform rotate-180' : ''
                          }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {expandedDayId === day.id && (
                    <div className="p-4 border-t border-gray-100">
                      <ul className="space-y-3">
                        {day.meals.map((meal, mealIndex) => (
                          <li key={meal.id} className="border-b border-gray-100 pb-2">
                            <h5 className="font-medium">{meal.name}</h5>
                            <ul className="text-sm text-gray-600 mt-1">
                              {meal.ingredients.map((ingredient, ingredientIndex) => (
                                <li key={ingredientIndex} className="flex justify-between items-center py-1">
                                  <span>{ingredient.name} ({ingredient.quantity})</span>
                                  <button
                                    onClick={() => openSubstitutionModal(
                                      day.id,
                                      mealIndex,
                                      ingredientIndex,
                                      ingredient.name,
                                      ingredient.quantity,
                                      meal.name
                                    )}
                                    className="text-indigo-600 hover:text-indigo-800 text-xs"
                                    title="Sustituir ingrediente"
                                  >
                                    Sustituir
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Selected day's meals */}
        <div className='flex flex-col'>
          <div
            className="flex justify-between items-center mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md -mx-2"
            onClick={() => setIsDayPlanCollapsed(!isDayPlanCollapsed)}
          >
            <div className="flex items-center">
              <h3 className="text-lg font-medium mr-2">
                Plan para {days.find(day => day.id === selectedDay)?.name || 'Día seleccionado'}:
              </h3>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${isDayPlanCollapsed ? 'transform rotate-180' : ''
                  }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {structuredWeekPlan[selectedDay] && structuredWeekPlan[selectedDay].length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearDay(selectedDay);
                }}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium"
              >
                Limpiar día
              </button>
            )}
          </div>

          {!isDayPlanCollapsed && (
            <div className="bg-gray-50 p-4 rounded-md overflow-y-auto flex-grow">
              {structuredWeekPlan[selectedDay] && structuredWeekPlan[selectedDay].length > 0 ? (
                <ul className="space-y-4">
                  {structuredWeekPlan[selectedDay].map((meal, index) => (
                    <li key={index} className="bg-white p-4 rounded-md shadow-sm">
                      <h4 className="font-medium text-indigo-600 mb-2">{meal.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">Ingredientes:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {meal.ingredients.map((ingredient, idx) => (
                          <li key={idx}>
                            {ingredient.name} ({ingredient.quantity})
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500 mb-4">
                    No hay plan de comidas para este día.
                  </p>
                  <p className="text-gray-500 text-sm">
                    Selecciona un plan de comida de la lista de disponibles.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de sustitución */}
      {substitutionModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black opacity-30"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Sustituir ingrediente
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Estás sustituyendo <span className="font-medium">{substitutionModal.ingredientName} ({substitutionModal.ingredientQuantity})</span> de la comida <span className="font-medium">{substitutionModal.mealName}</span>.
                      </p>

                      <div className="mb-4">
                        <label htmlFor="substitute-replacement" className="block text-sm font-medium text-gray-700 mb-1">
                          Reemplazar con
                        </label>
                        <select
                          id="substitute-replacement"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          value={substitutionModal.selectedReplacement}
                          onChange={(e) => setSubstitutionModal({
                            ...substitutionModal,
                            selectedReplacement: e.target.value
                          })}
                        >
                          <option value="">Selecciona un equivalente</option>
                          {(() => {
                            // Determinar la categoría del ingrediente
                            const category = getIngredientCategory(substitutionModal.ingredientName);

                            // Si tenemos equivalentes para esta categoría, mostrarlos
                            if (equivalentsByCategory[category]) {
                              return equivalentsByCategory[category].map((equivalent, index) => (
                                <option key={index} value={equivalent}>
                                  {equivalent}
                                </option>
                              ));
                            } else {
                              // Si no hay equivalentes específicos, mostrar todas las opciones
                              return Object.entries(equivalentsByCategory).map(([catName, equivalents]) => (
                                <optgroup key={catName} label={catName}>
                                  {equivalents.map((equivalent, index) => (
                                    <option key={`${catName}-${index}`} value={equivalent}>
                                      {equivalent}
                                    </option>
                                  ))}
                                </optgroup>
                              ));
                            }
                          })()}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    if (substitutionModal.selectedReplacement) {
                      handleSubstituteIngredient({
                        day: substitutionModal.dayPlanId,
                        mealIndex: substitutionModal.mealIndex,
                        ingredientIndex: substitutionModal.ingredientIndex,
                        replacement: substitutionModal.selectedReplacement
                      });
                    }
                  }}
                  disabled={!substitutionModal.selectedReplacement}
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeSubstitutionModal}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra lateral de herramientas */}
      <ToolsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddIngredient={handleAddIngredient}
        onSubstituteIngredient={handleSubstituteIngredient}
        categories={categories}
        otherCategoryName={otherCategoryName}
        weekPlan={structuredWeekPlan}
      />

      {/* Botón flotante para abrir la barra lateral */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-6 right-6 z-20 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Abrir herramientas"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );
}

export default MealPlanner; 