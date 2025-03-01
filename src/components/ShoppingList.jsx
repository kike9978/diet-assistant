import { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';

function ShoppingList({ weekPlan }) {
  const [shoppingList, setShoppingList] = useState({});
  const [pdfState, setPdfState] = useState({
    isGenerating: false,
    error: null,
    success: false
  });
  
  // Create a ref for the PDF content
  const pdfContentRef = useRef(null);

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
    // Reset states
    setPdfState({
      isGenerating: true,
      error: null,
      success: false
    });
    
    if (!pdfContentRef.current) {
      setPdfState({
        isGenerating: false,
        error: "Could not find content to export",
        success: false
      });
      return;
    }
    
    // Create a simplified HTML structure for the PDF
    const pdfContent = document.createElement('div');
    pdfContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #4F46E5; font-size: 24px; margin-bottom: 16px;">Shopping List</h1>
        <h2 style="font-size: 18px; margin-bottom: 12px;">Ingredients to Buy (${Object.keys(shoppingList).length})</h2>
        <ul style="list-style: none; padding: 0;">
          ${Object.values(shoppingList).map(item => `
            <li style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
              <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: bold;">${item.name}</span>
                <span style="color: #6B7280;">${item.quantities.join(', ')}</span>
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
    
    const opt = {
      margin: 1,
      filename: 'shopping-list.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(pdfContent).save()
      .then(() => {
        setPdfState({
          isGenerating: false,
          error: null,
          success: true
        });
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          setPdfState(prev => ({...prev, success: false}));
        }, 3000);
      })
      .catch(err => {
        console.error("PDF generation error:", err);
        setPdfState({
          isGenerating: false,
          error: "Failed to generate PDF. Please try again.",
          success: false
        });
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
          <div id="shopping-list-content" ref={pdfContentRef} className="mb-6">
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
          
          <div className="space-y-3">
            <button
              onClick={exportToPDF}
              disabled={pdfState.isGenerating}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                pdfState.isGenerating ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center`}
            >
              {pdfState.isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating PDF...
                </>
              ) : 'Export to PDF'}
            </button>
            
            {pdfState.error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
                Error: {pdfState.error}
              </div>
            )}
            
            {pdfState.success && (
              <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">
                PDF generated successfully!
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ShoppingList; 