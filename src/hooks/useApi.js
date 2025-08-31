import { useCallback } from 'react';
import { STORAGE_KEYS } from './useLocalStorage';

const API_BASE_URL = "http://localhost:3000/api";

export function useApi() {
	const getAuthHeaders = useCallback(() => {
		const token = localStorage.getItem(STORAGE_KEYS.token);
		return token ? { Authorization: `Bearer ${token}` } : {};
	}, []);

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

	const verifyToken = useCallback(async () => {
		return apiCall('/auth/verify');
	}, [apiCall]);

	const fetchDietPlan = useCallback(async (planId) => {
		return apiCall(`/dietplans/${planId}`);
	}, [apiCall]);

	const fetchWeekPlan = useCallback(async (userId, planId) => {
		return apiCall(`/users/${userId}/week-plan/${planId}`);
	}, [apiCall]);

	const saveWeekPlan = useCallback(async (userId, planId, weekPlan) => {
		return apiCall(`/users/${userId}/week-plan`, {
			method: 'PUT',
			body: JSON.stringify({ planId, weekPlan }),
		});
	}, [apiCall]);

	const saveDietPlan = useCallback(async (plan) => {
		return apiCall('/dietplans', {
			method: 'POST',
			body: JSON.stringify(plan),
		});
	}, [apiCall]);

	const updateUser = useCallback(async (userId, updates) => {
		return apiCall(`/users/${userId}`, {
			method: 'PUT',
			body: JSON.stringify(updates),
		});
	}, [apiCall]);

	return {
		verifyToken,
		fetchDietPlan,
		fetchWeekPlan,
		saveWeekPlan,
		saveDietPlan,
		updateUser,
	};
}
