import { useCallback, useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import LandingPage from "./components/LandingPage";
import HomePage from "./components/HomePage";
import LoadingSpinner from "./components/LoadingSpinner";
import LoginPage from "./components/LoginPage";
import MealPlannerPage from "./components/MealPlannerPage";
import MealPrepPage, { clearMealPrepLocalStorage } from "./components/MealPrepPage";
import { ToastProvider } from "./components/Toast";
import ResetConfirmationModal from "./components/ui/base/ResetConfirmationModal";
import { useApi } from "./hooks/useApi";
import { STORAGE_KEYS, useLocalStorage } from "./hooks/useLocalStorage";
import { useToast } from "./components/Toast";
import DietPlanManager from "./components/DietPlanManager";
import SimilarPlansModal from "./components/SimilarPlansModal";
import EditDietPlanModal from "./components/EditDietPlanModal";

// Constants
const DEBOUNCE_DELAY = 1000;

function App() {
	const [dietPlan, setDietPlan] = useState(null);
	const [weekPlan, setWeekPlan] = useState({});
	const [pageContent, setPageContent] = useState("home");
	const [showResetConfirmation, setShowResetConfirmation] = useState(false);
	const [planId, setPlanId] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [user, setUser] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	// New state for diet plan management
	const [showDietPlanManager, setShowDietPlanManager] = useState(false);
	const [showSimilarPlansModal, setShowSimilarPlansModal] = useState(false);
	const [similarPlans, setSimilarPlans] = useState([]);
	const [pendingDietPlan, setPendingDietPlan] = useState(null);
	const [dietPlansRefreshTrigger, setDietPlansRefreshTrigger] = useState(0);

	// Edit diet plan state
	const [showEditDietPlanModal, setShowEditDietPlanModal] = useState(false);
	const [editingDietPlan, setEditingDietPlan] = useState(null);

	// Custom hooks
	const { getItem, setItem, removeItem, clearUserData } = useLocalStorage();
	const {
		verifyToken,
		fetchDietPlan,
		fetchWeekPlan,
		saveWeekPlan,
		updateWeekPlan,
		saveDietPlan,
		updateUser,
		updateDietPlan,
		deleteDietPlan,
	} = useApi();
	const toast = useToast();

	const [pinnedPlans, setPinnedPlans] = useState(() => {
		return getItem(STORAGE_KEYS.pinnedPlans) || [];
	});

	// Load saved data from localStorage (fallback when API is unavailable)
	const loadSavedData = useCallback(() => {
		try {
			const savedDietPlan = getItem(STORAGE_KEYS.dietPlan);
			const savedWeekPlan = getItem(STORAGE_KEYS.weekPlan);

			if (savedDietPlan && savedDietPlan.id) {
				setDietPlan(savedDietPlan);
				setPlanId(savedDietPlan.id); // Use the diet plan's actual ID, not cached planId

				// Set week plan if available, otherwise use empty
				if (savedWeekPlan && Object.keys(savedWeekPlan).length > 0) {
					setWeekPlan(savedWeekPlan);
				} else {
					const emptyWeekPlan = createEmptyWeekPlan();
					setWeekPlan(emptyWeekPlan);
					setItem(STORAGE_KEYS.weekPlan, emptyWeekPlan);
				}

				setPageContent("plan");
			}
		} catch {
			// Clear corrupted data
			clearUserData();
		}
	}, [getItem, clearUserData, setItem]);

	// Create empty week plan
	const createEmptyWeekPlan = () => ({
		monday: [],
		tuesday: [],
		wednesday: [],
		thursday: [],
		friday: [],
		saturday: [],
		sunday: [],
	});

	// Fetch active diet plan from backend using activeDietPlanId
	const fetchActiveDietPlan = useCallback(
		async (userData, skipTokenCheck = false) => {
			const token = getItem(STORAGE_KEYS.token);
			if (!token && !skipTokenCheck) {
				return;
			}

			// Check if user has an activeDietPlanId
			if (!userData.activeDietPlanId || userData.activeDietPlanId === "null") {
				// No active plan - always clear local data and go to home
				clearUserData();
				setDietPlan(null);
				setWeekPlan({});
				setPlanId(null);
				setPageContent("home");
				return;
			}

			try {
				// Fetch the specific diet plan using the activeDietPlanId
				const serverPlan = await fetchDietPlan(userData.activeDietPlanId);
				setDietPlan(serverPlan);
				setItem(STORAGE_KEYS.dietPlan, serverPlan);

				// Set planId from the fetched plan
				if (serverPlan.id) {
					setPlanId(serverPlan.id);
				}

				// Always try to fetch the latest weekPlan from server first (to ensure sync across clients)
				try {
					if (userData.activeWeekPlanId) {
						const savedWeekPlan = await fetchWeekPlan(userData.activeWeekPlanId);
						if (savedWeekPlan && savedWeekPlan.days) {
							setWeekPlan(savedWeekPlan.days);
							setItem(STORAGE_KEYS.weekPlan, savedWeekPlan.days);
						} else {
							// Week plan exists but no data, start with empty
							const emptyWeekPlan = createEmptyWeekPlan();
							setWeekPlan(emptyWeekPlan);
							setItem(STORAGE_KEYS.weekPlan, emptyWeekPlan);
						}
					} else {
						// No active week plan ID, start with empty
						const emptyWeekPlan = createEmptyWeekPlan();
						setWeekPlan(emptyWeekPlan);
						setItem(STORAGE_KEYS.weekPlan, emptyWeekPlan);
					}
				} catch (error) {
					console.warn('Failed to fetch week plan from server, falling back to localStorage:', error);
					// Fallback to localStorage only if server fetch fails
					const savedWeekPlan = getItem(STORAGE_KEYS.weekPlan);
					if (savedWeekPlan && Object.keys(savedWeekPlan).length > 0) {
						setWeekPlan(savedWeekPlan);
					} else {
						const emptyWeekPlan = createEmptyWeekPlan();
						setWeekPlan(emptyWeekPlan);
						setItem(STORAGE_KEYS.weekPlan, emptyWeekPlan);
					}
				}

				// Always navigate to plan page when we have a valid diet plan
				setPageContent("plan");
			} catch (error) {
				console.error('Error fetching active diet plan:', error);
				// If this was called with skipTokenCheck, we're in login flow
				if (!skipTokenCheck) {
					// Fallback to localStorage if server fails
					loadSavedData();
				}
			}
		},
		[
			loadSavedData,
			getItem,
			clearUserData,
			setItem,
			fetchDietPlan,
			fetchWeekPlan,
		],
	);

	// Single useEffect for authentication and data loading
	useEffect(() => {
		const initializeApp = async () => {
			const token = getItem(STORAGE_KEYS.token);

			if (!token) {
				setIsLoading(false);
				return;
			}

			try {
				// Verify token
				const data = await verifyToken();

				// Store the complete user data including activeDietPlanId
				setUser(data.user);
				setIsAuthenticated(true);

				// After successful authentication, try to load the user's data
				try {
					await fetchActiveDietPlan(data.user);
				} catch {
					// Still authenticated, just load from localStorage as fallback
					loadSavedData();
				}
			} catch {
				removeItem(STORAGE_KEYS.token);
				setIsAuthenticated(false);
				setUser(null);
				// Clear all user data on auth failure
				clearUserData();
			} finally {
				setIsLoading(false);
			}
		};

		initializeApp();
	}, [
		fetchActiveDietPlan,
		loadSavedData,
		getItem,
		verifyToken,
		removeItem,
		clearUserData,
	]);

	// Handle case where user has active plan but couldn't fetch during login
	useEffect(() => {
		const retryFetchActivePlan = async () => {
			// Only run if:
			// 1. User is authenticated
			// 2. User has an active plan
			// 3. We're still on landing page (meaning fetch failed during login)
			// 4. No plan data in current state
			if (
				isAuthenticated &&
				user?.activeDietPlanId &&
				pageContent === "landing" &&
				!dietPlan &&
				!planId
			) {
				try {
					await fetchActiveDietPlan(user);
				} catch {
					// Retry failed, user will need to manually navigate or try again
				}
			}
		};

		// Small delay to ensure authentication is fully complete
		const timeoutId = setTimeout(retryFetchActivePlan, 500);
		return () => clearTimeout(timeoutId);
	}, [isAuthenticated, user, pageContent, dietPlan, planId, fetchActiveDietPlan]);

	// Periodic sync to keep week plans synchronized across clients
	useEffect(() => {
		if (!isAuthenticated || !user?.activeWeekPlanId || pageContent !== "plan") {
			return;
		}

		const syncWeekPlan = async () => {
			try {
				const latestWeekPlan = await fetchWeekPlan(user.activeWeekPlanId);
				if (latestWeekPlan && latestWeekPlan.days) {
					// Only update if the data is different to avoid unnecessary re-renders
					const currentWeekPlanString = JSON.stringify(weekPlan);
					const newWeekPlanString = JSON.stringify(latestWeekPlan.days);

					if (currentWeekPlanString !== newWeekPlanString) {
						console.log('Syncing week plan with latest server data');
						setWeekPlan(latestWeekPlan.days);
						setItem(STORAGE_KEYS.weekPlan, latestWeekPlan.days);
					}
				}
			} catch (error) {
				// Silent fail - don't interrupt user experience
				console.warn('Failed to sync week plan:', error);
			}
		};

		// Sync every 30 seconds
		const syncInterval = setInterval(syncWeekPlan, 30000);

		return () => clearInterval(syncInterval);
	}, [isAuthenticated, user?.activeWeekPlanId, pageContent, weekPlan, fetchWeekPlan, setItem]);

	// Called on login success from LoginPage
	const onLoginSuccess = async (loggedInUser) => {
		setUser(loggedInUser);
		setIsAuthenticated(true);

		// Check if user has an active diet plan
		if (!loggedInUser.activeDietPlanId || loggedInUser.activeDietPlanId === "null") {
			// User has no active plan - clear all data and go to home
			clearUserData();
			setDietPlan(null);
			setWeekPlan({});
			setPlanId(null);
			setPageContent("home");
		} else {
			// Always try to fetch from API first to ensure sync across clients
			try {
				await fetchActiveDietPlan(loggedInUser, true); // Skip token check for now
			} catch {
				// If API fails, fall back to localStorage for existing clients
				const savedDietPlan = getItem(STORAGE_KEYS.dietPlan);

				if (savedDietPlan && savedDietPlan.id) {
					loadSavedData();
				}
				// If both API and localStorage fail, will be retried by the useEffect hook
			}
		}

		setIsLoading(false);
	};

	// Save weekPlan to backend when it changes
	const saveWeekPlanToServer = useCallback(
		async (weekPlanData) => {
			if (!user?.id) return;

			try {
				let weekPlanId = user.activeWeekPlanId;

				// If user has an active week plan, always update it (don't create new ones)
				if (weekPlanId) {
					await updateWeekPlan(weekPlanId, { days: weekPlanData });
				} else {
					// Only create a new week plan if user doesn't have one yet
					const newWeekPlan = await saveWeekPlan({ days: weekPlanData });
					weekPlanId = newWeekPlan.id;

					// Update user's activeWeekPlanId to point to this shared week plan
					const updatedUser = await updateUser(user.id, { activeWeekPlanId: weekPlanId });

					// Update local user state
					setUser(updatedUser);
				}
			} catch (error) {
				console.warn('Failed to save week plan to server:', error);
				// Silent fail - week plan will be saved locally
			}
		},
		[user?.id, user?.activeWeekPlanId, saveWeekPlan, updateWeekPlan, updateUser],
	);

	// Save data to localStorage when state changes
	useEffect(() => {
		if (dietPlan) {
			setItem(STORAGE_KEYS.dietPlan, dietPlan);
		}
	}, [dietPlan, setItem]);

	useEffect(() => {
		if (Object.keys(weekPlan).length > 0) {
			setItem(STORAGE_KEYS.weekPlan, weekPlan);
			// Also save to server (with debouncing to avoid too many requests)
			const timeoutId = setTimeout(() => {
				saveWeekPlanToServer(weekPlan);
			}, DEBOUNCE_DELAY);

			return () => clearTimeout(timeoutId);
		}
	}, [weekPlan, saveWeekPlanToServer, setItem]);

	// Removed localStorage caching of planId - always use server's activeDietPlanId

	useEffect(() => {
		if (pinnedPlans.length > 0) {
			setItem(STORAGE_KEYS.pinnedPlans, pinnedPlans);
		}
	}, [pinnedPlans, setItem]);

	const postDietPlan = async (plan) => {
		try {
			const createdPlan = await saveDietPlan(plan);

			if (!createdPlan?.id) {
				throw new Error("No 'id' returned in created diet plan");
			}

			return createdPlan;
		} catch (error) {
			throw error;
		}
	};

	const handleDietPlanUpload = async (plan) => {
		const newPlanId = `plan_${Date.now()}`;

		setDietPlan(plan);
		setWeekPlan({});
		setPlanId(newPlanId);
		setPageContent("plan");

		setItem(STORAGE_KEYS.weekPlan, {});
		removeItem(STORAGE_KEYS.checkedItems);

		try {
			// First, save the diet plan to the backend
			const savedPlan = await postDietPlan(plan);

			// Then, update the user's activeDietPlanId to point to this plan
			if (user && savedPlan.id) {
				const updatedUser = await updateUser(user.id, { activeDietPlanId: savedPlan.id });

				// Update local user state with the new activeDietPlanId
				setUser(updatedUser);

				// Trigger refresh of diet plans list
				setDietPlansRefreshTrigger(prev => prev + 1);
				toast.success('Plan de dieta guardado exitosamente!');
			}
		} catch (error) {
			console.error('❌ Error in handleDietPlanUpload:', error);

			// Handle exact duplicate diet plan case
			if (error.message.includes('Exact duplicate diet plan detected')) {
				// Extract the existing plan ID from the error message
				const match = error.message.match(/ID: (\d+)/);
				if (match) {
					const existingPlanId = match[1];

					// Update user's activeDietPlanId to the existing plan
					const updatedUser = await updateUser(user.id, { activeDietPlanId: existingPlanId });

					// Update local user state
					setUser(updatedUser);

					// Show success message
					toast.success('Diet plan already exists! Using existing plan.');
					return;
				}
			}

			// Handle similar plans case
			if (error.message.includes('Similar diet plans detected')) {
				setSimilarPlans(error.similarPlans || []);
				setPendingDietPlan(plan);
				setShowSimilarPlansModal(true);
				return;
			}

			// Handle error silently - plan is still saved locally
		}
	};

	const handlePinCurrentPlan = () => {
		if (!dietPlan || !planId) return;

		const newPinnedPlan = {
			id: `pinned_${Date.now()}`,
			name: `Plan ${pinnedPlans.length + 1}`,
			planId: planId,
			dietPlan: dietPlan,
			weekPlan: weekPlan,
			createdAt: new Date().toISOString(),
		};

		setPinnedPlans([...pinnedPlans, newPinnedPlan]);
	};

	const handleRemovePinnedPlan = (pinnedPlanId) => {
		setPinnedPlans(pinnedPlans.filter((plan) => plan.id !== pinnedPlanId));
	};

	const handleLoadPinnedPlan = (pinnedPlan) => {
		setDietPlan(pinnedPlan.dietPlan);
		const cleanWeekPlan = createEmptyWeekPlan();
		setWeekPlan(cleanWeekPlan);
		setPlanId(pinnedPlan.planId);
		setPageContent("plan");

		setItem(STORAGE_KEYS.dietPlan, pinnedPlan.dietPlan);
		setItem(STORAGE_KEYS.weekPlan, cleanWeekPlan);
		removeItem(STORAGE_KEYS.checkedItems);
	};

	// Diet plan activation function
	const activateDietPlan = async (plan) => {
		try {
			const updatedUser = await updateUser(user.id, { activeDietPlanId: plan.id });
			setUser(updatedUser);
			// toast.success(`Plan "${plan.name}" activado`); // Commented out due to old cached code issue
			setShowDietPlanManager(false);
			await fetchActiveDietPlan(updatedUser);
		} catch (error) {
			console.error('Error selecting plan:', error);
			toast.error('Error al activar el plan');
		}
	};

	const handleLogout = () => {
		removeItem(STORAGE_KEYS.token);
		setIsAuthenticated(false);
		setUser(null);
		setDietPlan(null);
		setWeekPlan({});
		setPlanId(null);
		setPageContent("home");
	};

	// Keep the old function name for compatibility
	const handlePlanSelect = activateDietPlan;

	const handlePlanEdit = (plan) => {
		setEditingDietPlan(plan);
		setShowEditDietPlanModal(true);
	};

	const handleSaveEditedDietPlan = async (editedPlan) => {
		try {
			console.log('🔍 Debug - User ID:', user?.id);
			console.log('🔍 Debug - Diet Plan ID:', editingDietPlan.id);
			console.log('🔍 Debug - Edited Plan:', editedPlan);

			// Update the diet plan on the backend
			const updatedPlan = await updateDietPlan(editingDietPlan.id, editedPlan);

			// If this is the currently active plan, update the local state
			if (user?.activeDietPlanId === editingDietPlan.id) {
				setDietPlan(updatedPlan);
				setItem(STORAGE_KEYS.dietPlan, updatedPlan);
			}

			// Close the edit modal
			setShowEditDietPlanModal(false);
			setEditingDietPlan(null);

			// Trigger refresh of diet plans list
			console.log('🔍 Debug - Before incrementing dietPlansRefreshTrigger:', dietPlansRefreshTrigger);
			setDietPlansRefreshTrigger(prev => {
				console.log('🔍 Debug - Incrementing dietPlansRefreshTrigger from:', prev, 'to:', prev + 1);
				return prev + 1;
			});
			console.log('🔍 Debug - After incrementing dietPlansRefreshTrigger');

			// Show success message
			// toast.success('Plan de dieta actualizado exitosamente');
		} catch (error) {
			console.error('Error updating diet plan:', error);
			// toast.error('Error al actualizar el plan de dieta');
		}
	};

	const handleCancelEditDietPlan = () => {
		setShowEditDietPlanModal(false);
		setEditingDietPlan(null);
	};

	const handlePlanDelete = async (plan) => {
		try {
			console.log('🔍 Debug - Deleting diet plan:', plan.id);

			// Call the backend API to delete the diet plan
			await deleteDietPlan(plan.id);

			// If the deleted plan was the active one, clear it
			if (user?.activeDietPlanId === plan.id) {
				const updatedUser = await updateUser(user.id, { activeDietPlanId: null });
				setUser(updatedUser);
			}

			// Trigger refresh of diet plans list
			console.log('🔍 Debug - Before incrementing dietPlansRefreshTrigger for delete:', dietPlansRefreshTrigger);
			setDietPlansRefreshTrigger(prev => {
				console.log('🔍 Debug - Incrementing dietPlansRefreshTrigger from:', prev, 'to:', prev + 1);
				return prev + 1;
			});

			// Show success message
			// toast.success('Plan de dieta eliminado exitosamente');
		} catch (error) {
			console.error('Error deleting diet plan:', error);
			// toast.error('Error al eliminar el plan de dieta');
		}
	};

	const handlePlanDuplicate = async (plan, newPlanId) => {
		// Optionally set the duplicated plan as active
		// await handlePlanSelect({ ...plan, id: newPlanId });

		// Trigger refresh of diet plans list
		setDietPlansRefreshTrigger(prev => prev + 1);
	};

	// Similar plans modal handlers
	const handleUseExistingPlan = async (existingPlan) => {
		try {
			const updatedUser = await updateUser(user.id, { activeDietPlanId: existingPlan.id });
			setUser(updatedUser);
			// toast.success(`Usando plan existente: ${existingPlan.name}`);
			setShowSimilarPlansModal(false);
			setPendingDietPlan(null);

			// Fetch the diet plan data and navigate to the plan page using the updated user data
			await fetchActiveDietPlan(updatedUser);
		} catch (error) {
			console.error('Error using existing plan:', error);
			// toast.error('Error al usar plan existente');
		}
	};

	const handleCreateNewPlan = async () => {
		try {
			// Force create the new plan by adding a timestamp to the name
			const planWithTimestamp = {
				...pendingDietPlan,
				name: `${pendingDietPlan.name} (${new Date().toISOString()})`
			};

			const savedPlan = await postDietPlan(planWithTimestamp);

			if (user && savedPlan.id) {
				const updatedUser = await updateUser(user.id, { activeDietPlanId: savedPlan.id });
				setUser(updatedUser);
				// toast.success('Nuevo plan creado exitosamente');
			}

			setShowSimilarPlansModal(false);
			setPendingDietPlan(null);

			// Trigger refresh of diet plans list
			setDietPlansRefreshTrigger(prev => prev + 1);

			// Navigate to the plan page
			setPageContent("plan");
		} catch (error) {
			console.error('Error creating new plan:', error);
			// toast.error('Error al crear nuevo plan');
		}
	};

	const handleRenamePinnedPlan = (pinnedPlanId, newName) => {
		setPinnedPlans(
			pinnedPlans.map((plan) =>
				plan.id === pinnedPlanId ? { ...plan, name: newName } : plan,
			),
		);
	};

	const handleClearAndReset = () => {
		setShowResetConfirmation(true);
	};

	const confirmReset = async () => {
		clearUserData();
		clearMealPrepLocalStorage();

		setDietPlan(null);
		setWeekPlan({});
		setPlanId(null);
		setPageContent("home");
		setShowResetConfirmation(false);

		// Also clear the user's active plans from the backend
		try {
			if (user) {
				const updatedUser = await updateUser(user.id, {
					activeDietPlanId: null,
					activeWeekPlanId: null
				});

				// Update local user state
				setUser(updatedUser);
			}
		} catch {
			// Handle error silently
		}
	};

	const handleGoHome = async () => {
		try {
			// Clear the active diet plan ID on the backend
			if (user?.id) {
				const updatedUser = await updateUser(user.id, { activeDietPlanId: null });
				setUser(updatedUser);
			}

			// Clear local data
			clearUserData();
			setDietPlan(null);
			setWeekPlan({});
			setPlanId(null);

			// Navigate to home
			setPageContent("home");
		} catch (error) {
			console.error('Error going home:', error);
			// Still navigate to home even if backend update fails
			setPageContent("home");
		}
	};

	const cancelReset = () => {
		setShowResetConfirmation(false);
	};

	const updateLocalDietPlan = (updatedPlan) => {
		setDietPlan(updatedPlan);
	};

	// Loading state
	if (isLoading) {
		return <LoadingSpinner message="Cargando..." />;
	}

	// Authentication check
	if (!isAuthenticated) {
		return <LoginPage onLoginSuccess={onLoginSuccess} />;
	}

	// Main App Content
	return (
		<ErrorBoundary>
			<ToastProvider>
				<div className="h-screen max-h-[100dvh] bg-gray-100 flex flex-col overflow-hidden">
					<header className="bg-indigo-600 text-white p-4 shadow-md">
						<div className="container mx-auto flex justify-between items-center">
							<div className="flex flex-row space-x-4">
								<h1 className="text-2xl font-bold">Plan Alimenticio</h1>
								<div className="text-sm">
									<div>Usuario: {user?.name}</div>
									<div>Plan ID: {user?.activeDietPlanId || "Ninguno"}</div>
									<div>User ID: {user?.id}</div>
								</div>
							</div>

							{pageContent !== "home" && (
								<div
									className="flex space-x-2"
									role="toolbar"
									aria-label="Acciones del plan"
								>
									<button
										type="button"
										onClick={() => setShowDietPlanManager(true)}
										className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
										aria-label="Gestionar planes de dieta"
									>
										Mis Planes
									</button>
									<button
										type="button"
										onClick={handlePinCurrentPlan}
										className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
										aria-label="Guardar plan actual en la lista de planes guardados"
									>
										Guardar Plan
									</button>
									<button
										type="button"
										onClick={handleGoHome}
										className="px-4 py-2 bg-white text-indigo-600 rounded-md hover:bg-gray-50 transition-colors"
										aria-label="Ir al inicio"
									>
										Home
									</button>
									<button
										type="button"
										onClick={handleLogout}
										className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
										aria-label="Cerrar sesión y salir de la aplicación"
									>
										Logout
									</button>
								</div>
							)}
						</div>
					</header>

					<main className="container mx-auto py-8 px-4 flex-1 overflow-y-auto">
						{pageContent === "home" ? (
							<HomePage
								handleDietPlanUpload={handleDietPlanUpload}
								handleRemovePinnedPlan={handleRemovePinnedPlan}
								pinnedPlans={pinnedPlans}
								handleLoadPinnedPlan={handleLoadPinnedPlan}
								handleRenamePinnedPlan={handleRenamePinnedPlan}
								handleLogout={handleLogout}
								onPlanSelect={handlePlanSelect}
								onPlanEdit={handlePlanEdit}
								onPlanDelete={handlePlanDelete}
								onPlanDuplicate={handlePlanDuplicate}
								dietPlansRefreshTrigger={dietPlansRefreshTrigger}
							/>
						) : pageContent === "plan" ? (
							<MealPlannerPage
								dietPlan={dietPlan}
								weekPlan={weekPlan}
								setWeekPlan={setWeekPlan}
								updateDietPlan={updateLocalDietPlan}
							/>
						) : pageContent === "mealPrep" ? (
							<MealPrepPage weekPlan={weekPlan} />
						) : null}
					</main>

					{pageContent !== "home" && (
						<footer className="bg-indigo-600 text-white p-4 shadow-md">
							<nav aria-label="Navegación principal">
								<ul className="flex justify-between items-center">
									<li>
										<button
											type="button"
											className="cursor-pointer hover:underline transition-all"
											onClick={handleGoHome}
											aria-current={
												pageContent === "home" ? "page" : undefined
											}
										>
											Home
										</button>
									</li>
									<li>
										<button
											type="button"
											className="cursor-pointer hover:underline transition-all"
											onClick={() => setPageContent("plan")}
											aria-current={pageContent === "plan" ? "page" : undefined}
										>
											Meal Planning
										</button>
									</li>
									<li>
										<button
											type="button"
											className="cursor-pointer hover:underline transition-all"
											onClick={() => setPageContent("mealPrep")}
											aria-current={
												pageContent === "mealPrep" ? "page" : undefined
											}
										>
											Meal Prep
										</button>
									</li>
								</ul>
							</nav>
						</footer>
					)}

					{showResetConfirmation && (
						<ResetConfirmationModal
							confirmReset={confirmReset}
							cancelReset={cancelReset}
						/>
					)}

					{/* Diet Plan Manager Modal */}
					{showDietPlanManager && (
						<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
							<div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
								<div className="flex justify-between items-center mb-4">
									<h2 className="text-xl font-bold text-gray-800">
										Gestionar Planes de Dieta
									</h2>
									<button
										onClick={() => setShowDietPlanManager(false)}
										className="text-gray-400 hover:text-gray-600 text-2xl"
									>
										×
									</button>
								</div>
								<DietPlanManager
									onPlanSelect={handlePlanSelect}
									onPlanEdit={handlePlanEdit}
									onPlanDelete={handlePlanDelete}
									onPlanDuplicate={handlePlanDuplicate}
									dietPlansRefreshTrigger={dietPlansRefreshTrigger}
								/>
							</div>
						</div>
					)}

					{/* Similar Plans Modal */}
					<SimilarPlansModal
						isOpen={showSimilarPlansModal}
						similarPlans={similarPlans}
						onClose={() => {
							setShowSimilarPlansModal(false);
							setPendingDietPlan(null);
						}}
						onUseExisting={handleUseExistingPlan}
						onCreateNew={handleCreateNewPlan}
					/>

					{/* Edit Diet Plan Modal */}
					{showEditDietPlanModal && editingDietPlan && (
						<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
							<div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
								<div className="flex justify-between items-center mb-4">
									<h2 className="text-xl font-bold text-gray-800">
										Editar Plan de Dieta
									</h2>
									<button
										onClick={handleCancelEditDietPlan}
										className="text-gray-400 hover:text-gray-600 text-2xl"
									>
										×
									</button>
								</div>
								<EditDietPlanModal
									dietPlan={editingDietPlan}
									onSave={handleSaveEditedDietPlan}
									onCancel={handleCancelEditDietPlan}
								/>
							</div>
						</div>
					)}
				</div>
			</ToastProvider>
		</ErrorBoundary>
	);
}

export default App;
