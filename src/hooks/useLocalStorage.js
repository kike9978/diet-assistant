import { useCallback } from 'react';

const STORAGE_KEYS = {
	token: "token",
	dietPlan: "dietPlan",
	weekPlan: "weekPlan",
	checkedItems: "checkedItems",
	pinnedPlans: "pinnedPlans",
};

export { STORAGE_KEYS };

export function useLocalStorage() {
	const getItem = useCallback((key) => {
		try {
			const item = localStorage.getItem(key);
			return item ? JSON.parse(item) : null;
		} catch {
			return null;
		}
	}, []);

	const setItem = useCallback((key, value) => {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch (error) {
			console.error('Error saving to localStorage:', error);
		}
	}, []);

	const removeItem = useCallback((key) => {
		try {
			localStorage.removeItem(key);
		} catch (error) {
			console.error('Error removing from localStorage:', error);
		}
	}, []);

	const clearUserData = useCallback(() => {
		removeItem(STORAGE_KEYS.dietPlan);
		removeItem(STORAGE_KEYS.weekPlan);
		removeItem(STORAGE_KEYS.checkedItems);
	}, [removeItem]);

	return {
		getItem,
		setItem,
		removeItem,
		clearUserData,
		STORAGE_KEYS,
	};
}
