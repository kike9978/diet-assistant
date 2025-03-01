import { useState } from 'react';

function MealPlanner({ dietPlan, weekPlan, setWeekPlan }) {
  const [selectedDay, setSelectedDay] = useState('monday');
  const [expandedDayId, setExpandedDayId] = useState(null);

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

  const days = [
    { id: 'monday', name: 'Lunes' },
    { id: 'tuesday', name: 'Martes' },
    { id: 'wednesday', name: 'Miércoles' },
    { id: 'thursday', name: 'Jueves' },
    { id: 'friday', name: 'Viernes' },
    { id: 'saturday', name: 'Sábado' },
    { id: 'sunday', name: 'Domingo' },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Planificador de Comidas</h2>
      
      {/* Day selector */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Selecciona un día:</h3>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`py-2 px-3 rounded-md text-sm font-medium ${
                selectedDay === day.id
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Available day plans */}
        <div>
          <h3 className="text-lg font-medium mb-3">Planes de Comida Disponibles:</h3>
          <div className="bg-gray-50 p-4 rounded-md h-96 overflow-y-auto">
            {dietPlan && dietPlan.days && dietPlan.days.map((day) => (
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
                      className={`w-5 h-5 text-gray-500 transition-transform ${expandedDayId === day.id ? 'transform rotate-180' : ''}`} 
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
                      {day.meals.map((meal) => (
                        <li key={meal.id} className="border-b border-gray-100 pb-2">
                          <h5 className="font-medium">{meal.name}</h5>
                          <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                            {meal.ingredients.map((ingredient, idx) => (
                              <li key={idx}>
                                {ingredient.name} ({ingredient.quantity})
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Selected day's meals */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">
              Plan para {days.find(day => day.id === selectedDay)?.name || 'Día seleccionado'}:
            </h3>
            {structuredWeekPlan[selectedDay] && structuredWeekPlan[selectedDay].length > 0 && (
              <button
                onClick={() => handleClearDay(selectedDay)}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium"
              >
                Limpiar día
              </button>
            )}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md h-96 overflow-y-auto">
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
        </div>
      </div>
    </div>
  );
}

export default MealPlanner; 