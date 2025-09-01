import { useCallback } from 'react';
import { STORAGE_KEYS, useLocalStorage } from './useLocalStorage';

const API_BASE_URL = "http://localhost:3000/api";

export function useApi() {
	const { getItem } = useLocalStorage();

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

	const verifyToken = useCallback(async () => {
		return apiCall('/auth/verify');
	}, [apiCall]);

	const fetchDietPlan = useCallback(async (planId) => {
		return apiCall(`/dietplans/${planId}`);
	}, [apiCall]);

	const fetchWeekPlan = useCallback(async (planId) => {
		return apiCall(`/weekplans/${planId}`);
	}, [apiCall]);

	const saveWeekPlan = useCallback(async (weekPlan) => {
		return apiCall('/weekplans', {
			method: 'POST',
			body: JSON.stringify(weekPlan),
		});
	}, [apiCall]);

	const updateWeekPlan = useCallback(async (planId, weekPlan) => {
		return apiCall(`/weekplans/${planId}`, {
			method: 'PUT',
			body: JSON.stringify(weekPlan),
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

	// Additional API methods matching backend routes
	const fetchAllUsers = useCallback(async () => {
		return apiCall('/users');
	}, [apiCall]);

	const fetchUser = useCallback(async (userId, include = []) => {
		const queryParams = include.length > 0 ? `?include=${include.join(',')}` : '';
		return apiCall(`/users/${userId}${queryParams}`);
	}, [apiCall]);

	const createUser = useCallback(async (userData) => {
		return apiCall('/users', {
			method: 'POST',
			body: JSON.stringify(userData),
		});
	}, [apiCall]);

	const deleteUser = useCallback(async (userId) => {
		return apiCall(`/users/${userId}`, {
			method: 'DELETE',
		});
	}, [apiCall]);

	const fetchAllWeekPlans = useCallback(async () => {
		return apiCall('/weekplans');
	}, [apiCall]);

	const deleteWeekPlan = useCallback(async (planId) => {
		return apiCall(`/weekplans/${planId}`, {
			method: 'DELETE',
		});
	}, [apiCall]);

	const fetchAllDietPlans = useCallback(async () => {
		return apiCall('/dietplans');
	}, [apiCall]);

	const updateDietPlan = useCallback(async (planId, plan) => {
		return apiCall(`/dietplans/${planId}`, {
			method: 'PUT',
			body: JSON.stringify(plan),
		});
	}, [apiCall]);

	const deleteDietPlan = useCallback(async (planId) => {
		return apiCall(`/dietplans/${planId}`, {
			method: 'DELETE',
		});
	}, [apiCall]);

	const duplicateDietPlan = useCallback(async (planId) => {
		return apiCall(`/dietplans/${planId}/duplicate`, {
			method: 'POST',
		});
	}, [apiCall]);

	const fetchUserActiveDietPlan = useCallback(async (userId) => {
		return apiCall(`/users/${userId}/active-diet-plan`);
	}, [apiCall]);

	const fetchUserActiveWeekPlan = useCallback(async (userId) => {
		return apiCall(`/users/${userId}/active-week-plan`);
	}, [apiCall]);

	return {
		verifyToken,
		// Diet Plans
		fetchDietPlan,
		fetchAllDietPlans,
		saveDietPlan,
		updateDietPlan,
		deleteDietPlan,
		duplicateDietPlan,
		// Week Plans
		fetchWeekPlan,
		fetchAllWeekPlans,
		saveWeekPlan,
		updateWeekPlan,
		deleteWeekPlan,
		// Users
		fetchUser,
		fetchAllUsers,
		createUser,
		updateUser,
		deleteUser,
		// User Active Plans
		fetchUserActiveDietPlan,
		fetchUserActiveWeekPlan,
	};
}
