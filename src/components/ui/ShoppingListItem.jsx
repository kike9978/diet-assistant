import React, { useState } from 'react';

function ShoppingListItem({ item, showPrices, priceEstimate, formatQuantity, weekPlan, showSources }) {
    const [expandedSources, setExpandedSources] = useState(false);
    
    // Function to find sources of this ingredient in the week plan
    const findSources = () => {
        const sources = [];
        
        if (!weekPlan) return sources;
        
        // Normalize the ingredient name for comparison
        const normalizedName = item.name.toLowerCase();
        
        // Check each day in the week plan
        Object.entries(weekPlan).forEach(([day, meals]) => {
            // Map day IDs to readable names
            const dayName = 
                day === 'monday' ? 'Lunes' : 
                day === 'tuesday' ? 'Martes' : 
                day === 'wednesday' ? 'Miércoles' : 
                day === 'thursday' ? 'Jueves' : 
                day === 'friday' ? 'Viernes' : 
                day === 'saturday' ? 'Sábado' : 'Domingo';
            
            // Check each meal in the day
            meals.forEach(meal => {
                // Check if any ingredient in the meal matches our item
                const matchingIngredients = meal.ingredients.filter(ing => 
                    ing.name.toLowerCase() === normalizedName || 
                    item.variations.includes(ing.name.toLowerCase())
                );
                
                if (matchingIngredients.length > 0) {
                    sources.push({
                        day: dayName,
                        meal: meal.name,
                        ingredients: matchingIngredients
                    });
                }
            });
        });
        
        return sources;
    };
    
    const sources = findSources();
    const hasSources = sources.length > 0;
    
    return (
        <div>
            <div className="flex justify-between">
                <div>
                    <span className="font-medium">{item.name}</span>
                    {item.variations && item.variations.length > 1 && (
                        <div className="text-xs text-gray-500 mt-1">
                            Incluye: {item.variations.join(', ')}
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <span className="text-gray-600">
                        {formatQuantity(item)}
                    </span>
                    {showPrices && priceEstimate && priceEstimate.price && (
                        <div className="text-xs text-green-600 mt-1">
                            ${priceEstimate.price} MXN
                            <span className="text-gray-400 ml-1 hidden md:inline">
                                ({priceEstimate.explanation})
                            </span>
                        </div>
                    )}
                </div>
            </div>
            
            {hasSources && showSources && (
                <div className="mt-1">
                    <button 
                        onClick={() => setExpandedSources(!expandedSources)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                        <svg 
                            className={`w-3 h-3 mr-1 transition-transform ${expandedSources ? 'transform rotate-90' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        {expandedSources ? 'Ocultar detalles' : 'Mostrar detalles'}
                    </button>
                    
                    {expandedSources && (
                        <div className="mt-2 pl-3 border-l-2 border-indigo-100 text-xs text-gray-600">
                            {sources.map((source, index) => (
                                <div key={index} className="mb-1">
                                    <span className="font-medium">{source.day}</span> - {source.meal}:
                                    <ul className="pl-4 mt-1">
                                        {source.ingredients.map((ing, idx) => (
                                            <li key={idx}>{ing.quantity} {ing.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ShoppingListItem;   