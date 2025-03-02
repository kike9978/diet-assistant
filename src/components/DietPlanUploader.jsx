import { useState } from 'react';

function DietPlanUploader({ onUpload }) {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState(null);
  const [showExample, setShowExample] = useState(false);

  const handleJsonSubmit = () => {
    try {
      const plan = JSON.parse(jsonInput);
      if (validateDietPlan(plan)) {
        onUpload(plan);
        setError(null);
      } else {
        setError("Invalid diet plan format. Please check the example for the correct format.");
      }
    } catch (err) {
      setError("Invalid JSON. Please check your syntax.");
    }
  };

  const validateDietPlan = (plan) => {
    // Check if the plan has days
    if (!plan.days || !Array.isArray(plan.days) || plan.days.length === 0) {
      return false;
    }

    // Check if each day has the required properties
    for (const day of plan.days) {
      if (!day.id || !day.name || !day.meals || !Array.isArray(day.meals)) {
        return false;
      }

      // Check if each meal has the required properties
      for (const meal of day.meals) {
        if (!meal.id || !meal.name || !meal.ingredients || !Array.isArray(meal.ingredients)) {
          return false;
        }

        // Check if each ingredient has the required properties
        for (const ingredient of meal.ingredients) {
          if (!ingredient.name || !ingredient.quantity) {
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleSampleData = () => {
    const sampleData = {
      days: [
        {
          id: "day1",
          name: "Day 1",
          meals: [
            {
              id: "meal1",
              name: "Breakfast: Oatmeal with Fruits",
              ingredients: [
                { name: "Rolled Oats", quantity: "1/2 cup" },
                { name: "Banana", quantity: "1" },
                { name: "Berries", quantity: "1/2 cup" },
                { name: "Honey", quantity: "1 tbsp" },
                { name: "Almond Milk", quantity: "1 cup" }
              ]
            },
            {
              id: "meal2",
              name: "Lunch: Chicken Salad",
              ingredients: [
                { name: "Chicken Breast", quantity: "150g" },
                { name: "Mixed Greens", quantity: "2 cups" },
                { name: "Cherry Tomatoes", quantity: "1/2 cup" },
                { name: "Cucumber", quantity: "1/2" },
                { name: "Olive Oil", quantity: "1 tbsp" },
                { name: "Lemon", quantity: "1/2" }
              ]
            },
            {
              id: "meal3",
              name: "Dinner: Salmon with Vegetables",
              ingredients: [
                { name: "Salmon Fillet", quantity: "150g" },
                { name: "Broccoli", quantity: "1 cup" },
                { name: "Carrots", quantity: "1/2 cup" },
                { name: "Brown Rice", quantity: "1/2 cup" },
                { name: "Olive Oil", quantity: "1 tbsp" },
                { name: "Lemon", quantity: "1/2" }
              ]
            }
          ]
        },
        {
          id: "day2",
          name: "Day 2",
          meals: [
            {
              id: "meal4",
              name: "Breakfast: Avocado Toast",
              ingredients: [
                { name: "Whole Grain Bread", quantity: "2 slices" },
                { name: "Avocado", quantity: "1" },
                { name: "Eggs", quantity: "2" },
                { name: "Cherry Tomatoes", quantity: "1/4 cup" },
                { name: "Salt and Pepper", quantity: "to taste" }
              ]
            },
            {
              id: "meal5",
              name: "Lunch: Quinoa Bowl",
              ingredients: [
                { name: "Quinoa", quantity: "1/2 cup" },
                { name: "Black Beans", quantity: "1/2 cup" },
                { name: "Corn", quantity: "1/4 cup" },
                { name: "Avocado", quantity: "1/2" },
                { name: "Lime", quantity: "1/2" },
                { name: "Cilantro", quantity: "2 tbsp" }
              ]
            },
            {
              id: "meal6",
              name: "Dinner: Turkey Meatballs",
              ingredients: [
                { name: "Ground Turkey", quantity: "150g" },
                { name: "Zucchini Noodles", quantity: "2 cups" },
                { name: "Tomato Sauce", quantity: "1/2 cup" },
                { name: "Parmesan Cheese", quantity: "2 tbsp" },
                { name: "Garlic", quantity: "2 cloves" }
              ]
            }
          ]
        }
      ]
    };
    
    setJsonInput(JSON.stringify(sampleData, null, 2));
    setError(null);
  };

  const exampleJson = `{
  "days": [
    {
      "id": "day1",
      "name": "Day 1",
      "meals": [
        {
          "id": "meal1",
          "name": "Breakfast: Oatmeal with Fruits",
          "ingredients": [
            { "name": "Rolled Oats", "quantity": "1/2 cup" },
            { "name": "Banana", "quantity": "1" },
            { "name": "Berries", "quantity": "1/2 cup" }
          ]
        },
        {
          "id": "meal2",
          "name": "Lunch: Chicken Salad",
          "ingredients": [
            { "name": "Chicken Breast", "quantity": "150g" },
            { "name": "Mixed Greens", "quantity": "2 cups" },
            { "name": "Olive Oil", "quantity": "1 tbsp" }
          ]
        }
      ]
    }
  ]
}`;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Upload Your Diet Plan</h2>
      <p className="mb-4 text-gray-600">
        Enter your diet plan in JSON format or use our sample data to get started.
      </p>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="jsonInput" className="block text-sm font-medium text-gray-700">
            Diet Plan JSON
          </label>
          <button
            type="button"
            onClick={() => setShowExample(!showExample)}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            {showExample ? "Hide Example" : "Show Example"}
          </button>
          <a href="https://chat.deepseek.com/a/chat/s/46cbbfea-1c52-4511-97c9-8ede6a60d959" target='_blank' className="text-sm text-indigo-600 hover:text-indigo-800">JSON Generator</a>
        </div>
        
        {showExample && (
          <div className="mb-4 p-4 bg-gray-50 rounded-md overflow-auto max-h-60">
            <pre className="text-xs text-gray-700">{exampleJson}</pre>
          </div>
        )}
        
        <textarea
          id="jsonInput"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className="w-full h-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Paste your diet plan JSON here..."
        />
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="flex justify-between">
        <button
          onClick={handleSampleData}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Use Sample Data
        </button>
        
        <button
          onClick={handleJsonSubmit}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default DietPlanUploader; 