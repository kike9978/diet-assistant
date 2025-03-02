import React from 'react';

function ShoppingListItem({ item, showPrices, priceEstimate, formatQuantity }) {
    return (
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
    );
}

export default ShoppingListItem;   