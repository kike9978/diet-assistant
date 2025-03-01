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
              quantities: [ingredient.quantity],
              totalQuantity: parseQuantity(ingredient.quantity)
            };
          } else {
            ingredients[key].quantities.push(ingredient.quantity);
            
            // Try to add to the total quantity if possible
            const parsedQuantity = parseQuantity(ingredient.quantity);
            if (parsedQuantity && ingredients[key].totalQuantity) {
              // Normalize units for comparison
              const normalizedCurrentUnit = normalizeUnit(ingredients[key].totalQuantity.unit);
              const normalizedNewUnit = normalizeUnit(parsedQuantity.unit);
              
              // Only add if normalized units match or both are unitless
              if (normalizedCurrentUnit === normalizedNewUnit) {
                ingredients[key].totalQuantity.value += parsedQuantity.value;
                // Keep the original unit format from the first occurrence
              } else {
                // Units don't match, can't sum
                ingredients[key].totalQuantity = null;
              }
            }
          }
        });
      });
    });
    
    setShoppingList(ingredients);
  };

  // Helper function to normalize units for comparison
  const normalizeUnit = (unit) => {
    if (!unit) return '';
    
    const unitLower = unit.toLowerCase().trim();
    
    // Handle Spanish abbreviations and variations
    if (unitLower === 'cda' || unitLower === 'cdas' || unitLower === 'cucharada' || unitLower === 'cucharadas') {
      return 'cda';
    }
    if (unitLower === 'cdta' || unitLower === 'cdtas' || unitLower === 'cucharadita' || unitLower === 'cucharaditas') {
      return 'cdta';
    }
    if (unitLower === 'tza' || unitLower === 'tzas' || unitLower === 'taza' || unitLower === 'tazas') {
      return 'tza';
    }
    
    // Handle English units
    if (unitLower === 'tbsp' || unitLower === 'tablespoon' || unitLower === 'tablespoons') {
      return 'tbsp';
    }
    if (unitLower === 'tsp' || unitLower === 'teaspoon' || unitLower === 'teaspoons') {
      return 'tsp';
    }
    if (unitLower === 'cup' || unitLower === 'cups') {
      return 'cup';
    }
    
    // Return the original unit if no normalization is needed
    return unitLower;
  };

  // Helper function to parse quantity strings like "150g", "2 cups", "1/2 cup", "1", "1/2", "2 1/2 tzas", "1 cda", etc.
  const parseQuantity = (quantityStr) => {
    // Trim the input
    const trimmed = quantityStr.trim();
    
    // Handle simple numeric values (e.g., "1", "2")
    if (/^\d+$/.test(trimmed)) {
      return { value: parseInt(trimmed), unit: '' };
    }
    
    // Handle simple fractions without units (e.g., "1/2")
    const simpleFractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
    if (simpleFractionMatch) {
      const numerator = parseInt(simpleFractionMatch[1]);
      const denominator = parseInt(simpleFractionMatch[2]);
      
      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return { value: numerator / denominator, unit: '' };
      }
    }
    
    // Handle mixed numbers with units (e.g., "2 1/2 tzas")
    const mixedNumberWithUnitMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)\s+(.+)$/);
    if (mixedNumberWithUnitMatch) {
      const whole = parseInt(mixedNumberWithUnitMatch[1]);
      const numerator = parseInt(mixedNumberWithUnitMatch[2]);
      const denominator = parseInt(mixedNumberWithUnitMatch[3]);
      const unit = mixedNumberWithUnitMatch[4];
      
      if (!isNaN(whole) && !isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return { value: whole + (numerator / denominator), unit };
      }
    }
    
    // Handle fractions with units (e.g., "1/2 cup")
    const fractionWithUnitMatch = trimmed.match(/^(\d+)\/(\d+)\s+(.+)$/);
    if (fractionWithUnitMatch) {
      const numerator = parseInt(fractionWithUnitMatch[1]);
      const denominator = parseInt(fractionWithUnitMatch[2]);
      const unit = fractionWithUnitMatch[3];
      
      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return { value: numerator / denominator, unit };
      }
    }
    
    // Handle number with units (e.g., "150g", "1.5 cups", "2 tzas", "1 cda")
    const numberWithUnitMatch = trimmed.match(/^([\d.]+)\s*(.+)$/);
    if (numberWithUnitMatch) {
      const value = parseFloat(numberWithUnitMatch[1]);
      const unit = numberWithUnitMatch[2];
      
      if (!isNaN(value)) {
        return { value, unit };
      }
    }
    
    return null;
  };

  // Format the quantity for display
  const formatQuantity = (item) => {
    if (item.totalQuantity) {
      const { value, unit } = item.totalQuantity;
      
      // Format based on unit type
      if (unit === '') {
        // For unitless quantities, handle fractions nicely
        if (value === 0.5) return "1/2";
        if (value === 0.25) return "1/4";
        if (value === 0.75) return "3/4";
        if (Math.floor(value) !== value) {
          // Try to convert to a mixed number if appropriate
          const whole = Math.floor(value);
          const fraction = value - whole;
          
          if (whole > 0) {
            if (Math.abs(fraction - 0.5) < 0.01) return `${whole} 1/2`;
            if (Math.abs(fraction - 0.25) < 0.01) return `${whole} 1/4`;
            if (Math.abs(fraction - 0.75) < 0.01) return `${whole} 3/4`;
          } else {
            if (Math.abs(fraction - 0.5) < 0.01) return "1/2";
            if (Math.abs(fraction - 0.25) < 0.01) return "1/4";
            if (Math.abs(fraction - 0.75) < 0.01) return "3/4";
          }
        }
        // For other values, use decimal or whole number
        return value % 1 === 0 ? Math.round(value).toString() : value.toFixed(2);
      } else {
        // For units like "tzas", "cup", etc.
        // Handle common fractions and mixed numbers
        const whole = Math.floor(value);
        const fraction = value - whole;
        
        if (whole === 0) {
          // Just a fraction
          if (Math.abs(fraction - 0.5) < 0.01) return `1/2 ${unit}`;
          if (Math.abs(fraction - 0.25) < 0.01) return `1/4 ${unit}`;
          if (Math.abs(fraction - 0.75) < 0.01) return `3/4 ${unit}`;
        } else if (Math.abs(fraction) < 0.01) {
          // Just a whole number
          return `${whole} ${unit}`;
        } else {
          // Mixed number
          if (Math.abs(fraction - 0.5) < 0.01) return `${whole} 1/2 ${unit}`;
          if (Math.abs(fraction - 0.25) < 0.01) return `${whole} 1/4 ${unit}`;
          if (Math.abs(fraction - 0.75) < 0.01) return `${whole} 3/4 ${unit}`;
        }
        
        // For other values, use decimal
        return `${value % 1 === 0 ? whole : value.toFixed(2)} ${unit}`;
      }
    }
    
    // Fall back to the original quantities if we couldn't parse and sum them
    return item.quantities.join(', ');
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
                <span style="color: #6B7280;">${formatQuantity(item)}</span>
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
                      {formatQuantity(item)}
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