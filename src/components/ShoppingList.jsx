import { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';

function ShoppingList({ weekPlan }) {
  const [shoppingList, setShoppingList] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    generateShoppingList();
  }, [weekPlan]);

  const generateShoppingList = () => {
    const ingredients = {};
    
    // Iterate through all days and meals
    Object.values(weekPlan).forEach(dayMeals => {
      dayMeals.forEach(meal => {
        meal.ingredients.forEach(ingredient => {
          const key = ingredient.name.toLowerCase();
          
          if (!ingredients[key]) {
            ingredients[key] = {
              name: ingredient.name,
              quantities: [ingredient.quantity]
            };
          } else {
            ingredients[key].quantities.push(ingredient.quantity);
          }
        });
      });
    });
    
    setShoppingList(ingredients);
  };

  const exportToPDF = () => {
    setIsGenerating(true);
    
    const element = document.getElementById('shopping-list-content');
    const opt = {
      margin: 1,
      filename: 'shopping-list.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
      setIsGenerating(false);
    });
  };

  const ingredientCount = Object.keys(shoppingList).length;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Shopping List</h2>
      
      {ingredientCount === 0 ? (
        <p className="text-gray-500">Add meals to your week plan to generate a shopping list.</p>
      ) : (
        <>
          <div id="shopping-list-content" className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Ingredients to Buy ({ingredientCount})</h3>
            <ul className="divide-y divide-gray-200">
              {Object.values(shoppingList).map((item, index) => (
                <li key={index} className="py-3">
                  <div className="flex justify-between">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-600">
                      {item.quantities.join(', ')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <button
            onClick={exportToPDF}
            disabled={isGenerating}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              isGenerating ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
            } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
          >
            {isGenerating ? 'Generating PDF...' : 'Export to PDF'}
          </button>
        </>
      )}
    </div>
  );
}

export default ShoppingList; 