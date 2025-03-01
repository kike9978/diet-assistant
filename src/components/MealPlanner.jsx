import { useState } from 'react';
import { PlusIcon } from './Icons';

function MealPlanner({ dietPlan, weekPlan, setWeekPlan }) {
  const [availableDays, setAvailableDays] = useState(() => {
    // Use the original diet plan days
    return dietPlan.days;
  });

  const addDayToWeekday = (dayPlan, weekdayId) => {
    // Create a copy of the meals from the day plan
    const mealsToAdd = dayPlan.meals.map(meal => ({
      ...meal,
      id: `${meal.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
    
    setWeekPlan(prev => ({
      ...prev,
      [weekdayId]: mealsToAdd
    }));
  };

  const clearDay = (weekdayId) => {
    setWeekPlan(prev => ({
      ...prev,
      [weekdayId]: []
    }));
  };

  const weekdays = [
    { id: 'monday', name: 'Monday' },
    { id: 'tuesday', name: 'Tuesday' },
    { id: 'wednesday', name: 'Wednesday' },
    { id: 'thursday', name: 'Thursday' },
    { id: 'friday', name: 'Friday' },
    { id: 'saturday', name: 'Saturday' },
    { id: 'sunday', name: 'Sunday' },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Meal Planner</h2>
      <p className="mb-4 text-gray-600">
        Select a full day meal plan and assign it to a day of the week.
      </p>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Available Day Plans */}
        <div className="lg:w-1/3 bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Available Day Plans</h3>
          <div className="space-y-6">
            {availableDays.map((dayPlan) => (
              <div
                key={dayPlan.id}
                className="bg-indigo-50 p-4 rounded-lg border border-indigo-100"
              >
                <h4 className="font-bold text-indigo-700 mb-2">{dayPlan.name}</h4>
                
                <div className="space-y-3 mb-4">
                  {dayPlan.meals.map((meal) => (
                    <div key={meal.id} className="bg-white p-3 rounded shadow-sm">
                      <p className="font-medium">{meal.name}</p>
                      <div className="mt-1 text-xs text-gray-500">
                        {meal.ingredients.length} ingredients
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Assign to:</p>
                  <div className="flex flex-wrap gap-2">
                    {weekdays.map(weekday => (
                      <button
                        key={weekday.id}
                        onClick={() => addDayToWeekday(dayPlan, weekday.id)}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded"
                      >
                        {weekday.name.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Week Plan */}
        <div className="lg:w-2/3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {weekdays.map(weekday => (
              <div key={weekday.id} className="bg-white rounded-lg shadow overflow-hidden">
                <h3 className="text-lg font-semibold bg-indigo-600 text-white p-2">
                  {weekday.name}
                </h3>
                
                <div className="p-3 min-h-[250px]">
                  {weekPlan[weekday.id].length === 0 ? (
                    <p className="text-gray-400 text-center mt-8">No meals assigned</p>
                  ) : (
                    <>
                      <div className="space-y-3 mb-3">
                        {weekPlan[weekday.id].map((meal) => (
                          <div key={meal.id} className="bg-gray-50 p-2 rounded border border-gray-100">
                            <p className="font-medium text-sm">{meal.name}</p>
                          </div>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => clearDay(weekday.id)}
                        className="w-full mt-2 text-xs text-red-600 hover:text-red-800 flex items-center justify-center py-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear day
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MealPlanner; 