import { useCallback, useState, useEffect } from 'react';
import { STORAGE_KEYS, useLocalStorage } from './useLocalStorage';

const API_BASE_URL = "http://localhost:3000/api";

export function useImprovedApi() {
    const { getItem } = useLocalStorage();
    const [cache, setCache] = useState({
        ingredients: new Map(),
        recipes: new Map(),
        categories: new Map(),
        mealTypes: new Map(),
        weekPlans: new Map()
    });
    const [loading, setLoading] = useState({
        ingredients: false,
        recipes: false,
        weekPlan: false,
        shoppingList: false
    });
    const [errors, setErrors] = useState({
        ingredients: null,
        recipes: null,
        weekPlan: null,
        shoppingList: null
    });

    const getAuthHeaders = useCallback(() => {
        const token = getItem(STORAGE_KEYS.token);
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, [getItem]);

    const apiCall = useCallback(async (endpoint, options = {}) => {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
                ...options.headers,
            },
        };

        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || `Request failed: ${response.status}`);
        }

        return response.json();
    }, [getAuthHeaders]);

    // ================================
    // INGREDIENT MANAGEMENT
    // ================================

    const fetchIngredients = useCallback(async (options = {}) => {
        const { search, categoryId, forceRefresh = false } = options;

        // Check cache first
        const cacheKey = `${search || ''}-${categoryId || 'all'}`;
        if (!forceRefresh && cache.ingredients.has(cacheKey)) {
            return cache.ingredients.get(cacheKey);
        }

        setLoading(prev => ({ ...prev, ingredients: true }));
        setErrors(prev => ({ ...prev, ingredients: null }));

        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (categoryId) params.append('categoryId', categoryId);
            params.append('limit', '100');

            const result = await apiCall(`/ingredients?${params}`);

            // Update cache
            setCache(prev => ({
                ...prev,
                ingredients: new Map(prev.ingredients).set(cacheKey, result.ingredients)
            }));

            return result.ingredients;
        } catch (error) {
            setErrors(prev => ({ ...prev, ingredients: error.message }));
            throw error;
        } finally {
            setLoading(prev => ({ ...prev, ingredients: false }));
        }
    }, [apiCall, cache.ingredients]);

    const createIngredient = useCallback(async (ingredientData) => {
        setLoading(prev => ({ ...prev, ingredients: true }));
        setErrors(prev => ({ ...prev, ingredients: null }));

        try {
            const result = await apiCall('/ingredients', {
                method: 'POST',
                body: JSON.stringify(ingredientData),
            });

            // Clear cache to force refresh
            setCache(prev => ({
                ...prev,
                ingredients: new Map()
            }));

            return result;
        } catch (error) {
            setErrors(prev => ({ ...prev, ingredients: error.message }));
            throw error;
        } finally {
            setLoading(prev => ({ ...prev, ingredients: false }));
        }
    }, [apiCall]);

    // ================================
    // RECIPE MANAGEMENT
    // ================================

    const fetchRecipes = useCallback(async (options = {}) => {
        const { mealTypeId, search, tags, isPublic, forceRefresh = false } = options;

        // Check cache first
        const cacheKey = `${mealTypeId || 'all'}-${search || ''}-${tags?.join(',') || ''}-${isPublic || 'all'}`;
        if (!forceRefresh && cache.recipes.has(cacheKey)) {
            return cache.recipes.get(cacheKey);
        }

        setLoading(prev => ({ ...prev, recipes: true }));
        setErrors(prev => ({ ...prev, recipes: null }));

        try {
            const params = new URLSearchParams();
            if (mealTypeId) params.append('mealTypeId', mealTypeId);
            if (search) params.append('search', search);
            if (tags) params.append('tags', tags.join(','));
            if (isPublic !== undefined) params.append('isPublic', isPublic);
            params.append('limit', '50');

            const result = await apiCall(`/recipes?${params}`);

            // Update cache
            setCache(prev => ({
                ...prev,
                recipes: new Map(prev.recipes).set(cacheKey, result.recipes)
            }));

            return result.recipes;
        } catch (error) {
            setErrors(prev => ({ ...prev, recipes: error.message }));
            throw error;
        } finally {
            setLoading(prev => ({ ...prev, recipes: false }));
        }
    }, [apiCall, cache.recipes]);

    const fetchRecipe = useCallback(async (recipeId) => {
        // Check cache first
        if (cache.recipes.has(`recipe-${recipeId}`)) {
            return cache.recipes.get(`recipe-${recipeId}`);
        }

        setLoading(prev => ({ ...prev, recipes: true }));
        setErrors(prev => ({ ...prev, recipes: null }));

        try {
            const result = await apiCall(`/recipes/${recipeId}`);

            // Update cache
            setCache(prev => ({
                ...prev,
                recipes: new Map(prev.recipes).set(`recipe-${recipeId}`, result)
            }));

            return result;
        } catch (error) {
            setErrors(prev => ({ ...prev, recipes: error.message }));
            throw error;
        } finally {
            setLoading(prev => ({ ...prev, recipes: false }));
        }
    }, [apiCall, cache.recipes]);

    const createRecipe = useCallback(async (recipeData) => {
        setLoading(prev => ({ ...prev, recipes: true }));
        setErrors(prev => ({ ...prev, recipes: null }));

        try {
            const result = await apiCall('/recipes', {
                method: 'POST',
                body: JSON.stringify(recipeData),
            });

            // Clear cache to force refresh
            setCache(prev => ({
                ...prev,
                recipes: new Map()
            }));

            return result;
        } catch (error) {
            setErrors(prev => ({ ...prev, recipes: error.message }));
            throw error;
        } finally {
            setLoading(prev => ({ ...prev, recipes: false }));
        }
    }, [apiCall]);

    // ================================
    // WEEK PLAN MANAGEMENT
    // ================================

    const fetchCurrentWeekPlan = useCallback(async () => {
        setLoading(prev => ({ ...prev, weekPlan: true }));
        setErrors(prev => ({ ...prev, weekPlan: null }));

        try {
            const result = await apiCall('/week-plans/current');

            // Update cache
            setCache(prev => ({
                ...prev,
                weekPlans: new Map(prev.weekPlans).set('current', result)
            }));

            return result;
        } catch (error) {
            setErrors(prev => ({ ...prev, weekPlan: error.message }));
            throw error;
        } finally {
            setLoading(prev => ({ ...prev, weekPlan: false }));
        }
    }, [apiCall]);

    const scheduleMeal = useCallback(async (weekPlanId, mealData) => {
        setLoading(prev => ({ ...prev, weekPlan: true }));
        setErrors(prev => ({ ...prev, weekPlan: null }));

        try {
            const result = await apiCall(`/week-plans/${weekPlanId}/schedule-meal`, {
                method: 'PUT',
                body: JSON.stringify(mealData),
            });

            // Clear week plan cache to force refresh
            setCache(prev => ({
                ...prev,
                weekPlans: new Map()
            }));

            return result;
        } catch (error) {
            setErrors(prev => ({ ...prev, weekPlan: error.message }));
            throw error;
        } finally {
            setLoading(prev => ({ ...prev, weekPlan: false }));
        }
    }, [apiCall]);

    // ================================
    // SHOPPING LIST
    // ================================

    const generateShoppingList = useCallback(async (weekPlanId) => {
        setLoading(prev => ({ ...prev, shoppingList: true }));
        setErrors(prev => ({ ...prev, shoppingList: null }));

        try {
            const result = await apiCall(`/week-plans/${weekPlanId}/shopping-list`);
            return result;
        } catch (error) {
            setErrors(prev => ({ ...prev, shoppingList: error.message }));
            throw error;
        } finally {
            setLoading(prev => ({ ...prev, shoppingList: false }));
        }
    }, [apiCall]);

    // ================================
    // REFERENCE DATA
    // ================================

    const fetchCategories = useCallback(async () => {
        // Check cache first
        if (cache.categories.has('all')) {
            return cache.categories.get('all');
        }

        try {
            const result = await apiCall('/categories');

            // Update cache
            setCache(prev => ({
                ...prev,
                categories: new Map(prev.categories).set('all', result)
            }));

            return result;
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            return [];
        }
    }, [apiCall, cache.categories]);

    const fetchMealTypes = useCallback(async () => {
        // Check cache first
        if (cache.mealTypes.has('all')) {
            return cache.mealTypes.get('all');
        }

        try {
            const result = await apiCall('/meal-types');

            // Update cache
            setCache(prev => ({
                ...prev,
                mealTypes: new Map(prev.mealTypes).set('all', result)
            }));

            return result;
        } catch (error) {
            console.error('Failed to fetch meal types:', error);
            return [];
        }
    }, [apiCall, cache.mealTypes]);

    // ================================
    // CACHE MANAGEMENT
    // ================================

    const clearCache = useCallback((type = null) => {
        if (type) {
            setCache(prev => ({
                ...prev,
                [type]: new Map()
            }));
        } else {
            setCache({
                ingredients: new Map(),
                recipes: new Map(),
                categories: new Map(),
                mealTypes: new Map(),
                weekPlans: new Map()
            });
        }
    }, []);

    const clearErrors = useCallback((type = null) => {
        if (type) {
            setErrors(prev => ({ ...prev, [type]: null }));
        } else {
            setErrors({
                ingredients: null,
                recipes: null,
                weekPlan: null,
                shoppingList: null
            });
        }
    }, []);

    return {
        // Ingredient methods
        fetchIngredients,
        createIngredient,

        // Recipe methods
        fetchRecipes,
        fetchRecipe,
        createRecipe,

        // Week plan methods
        fetchCurrentWeekPlan,
        scheduleMeal,

        // Shopping list methods
        generateShoppingList,

        // Reference data methods
        fetchCategories,
        fetchMealTypes,

        // Cache management
        clearCache,
        clearErrors,

        // State
        loading,
        errors,
        cache
    };
}
