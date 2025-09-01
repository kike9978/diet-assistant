import React, { useState, useEffect } from 'react';
import { useImprovedApi } from '../hooks/useImprovedApi';

export default function ImprovedIngredientSearch() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [ingredients, setIngredients] = useState([]);
    const [categories, setCategories] = useState([]);

    const {
        fetchIngredients,
        fetchCategories,
        loading,
        errors,
        clearErrors
    } = useImprovedApi();

    // Load categories on component mount
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const categoriesData = await fetchCategories();
                setCategories(categoriesData);
            } catch (error) {
                console.error('Failed to load categories:', error);
            }
        };
        loadCategories();
    }, [fetchCategories]);

    // Search ingredients when search term or category changes
    useEffect(() => {
        const searchIngredients = async () => {
            if (searchTerm.length > 0 || selectedCategory) {
                try {
                    const options = {
                        search: searchTerm || undefined,
                        categoryId: selectedCategory || undefined
                    };
                    const ingredientsData = await fetchIngredients(options);
                    setIngredients(ingredientsData);
                } catch (error) {
                    console.error('Failed to search ingredients:', error);
                }
            } else {
                setIngredients([]);
            }
        };

        // Debounce search
        const timeoutId = setTimeout(searchIngredients, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, selectedCategory, fetchIngredients]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        clearErrors('ingredients');
    };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
        clearErrors('ingredients');
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Improved Ingredient Search</h2>

            {/* Search Controls */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1">
                    <label htmlFor="search" className="block text-sm font-medium mb-2">
                        Search Ingredients
                    </label>
                    <input
                        id="search"
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Type to search ingredients..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div className="w-64">
                    <label htmlFor="category" className="block text-sm font-medium mb-2">
                        Category
                    </label>
                    <select
                        id="category"
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Loading State */}
            {loading.ingredients && (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Searching ingredients...</p>
                </div>
            )}

            {/* Error State */}
            {errors.ingredients && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <p className="text-red-800">Error: {errors.ingredients}</p>
                </div>
            )}

            {/* Results */}
            {!loading.ingredients && ingredients.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ingredients.map(ingredient => (
                        <div
                            key={ingredient.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">
                                        {ingredient.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {ingredient.category_name}
                                    </p>
                                    {ingredient.default_unit && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Default unit: {ingredient.default_unit}
                                        </p>
                                    )}
                                </div>
                                {ingredient.color_code && (
                                    <div
                                        className="w-4 h-4 rounded-full ml-2"
                                        style={{ backgroundColor: ingredient.color_code }}
                                    ></div>
                                )}
                            </div>

                            {/* Nutritional Info */}
                            {ingredient.calories_per_100g && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-gray-500">Calories:</span>
                                            <span className="ml-1 font-medium">
                                                {ingredient.calories_per_100g}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Protein:</span>
                                            <span className="ml-1 font-medium">
                                                {ingredient.protein_per_100g}g
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Carbs:</span>
                                            <span className="ml-1 font-medium">
                                                {ingredient.carbs_per_100g}g
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Fat:</span>
                                            <span className="ml-1 font-medium">
                                                {ingredient.fat_per_100g}g
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* No Results */}
            {!loading.ingredients && searchTerm && ingredients.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500">No ingredients found matching your search.</p>
                </div>
            )}

            {/* Initial State */}
            {!loading.ingredients && !searchTerm && ingredients.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500">Start typing to search for ingredients...</p>
                </div>
            )}
        </div>
    );
}
