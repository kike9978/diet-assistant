import { useCallback, useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import LandingPage from "./components/LandingPage";
import LoadingSpinner from "./components/LoadingSpinner";
import LoginPage from "./components/LoginPage";
import MealPlannerPage from "./components/MealPlannerPage";
import MealPrepPage from "./components/MealPrepPage";
import { ToastProvider } from "./components/Toast";
import ResetConfirmationModal from "./components/ui/base/ResetConfirmationModal";
import { useApi } from "./hooks/useApi";
import { STORAGE_KEYS, useLocalStorage } from "./hooks/useLocalStorage";

// Constants
const DEBOUNCE_DELAY = 1000;

function App() {
	const [dietPlan, setDietPlan] = useState(null);
	const [weekPlan, setWeekPlan] = useState({});
	const [pageContent, setPageContent] = useState("landing");
	const [showResetConfirmation, setShowResetConfirmation] = useState(false);
	const [planId, setPlanId] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [user, setUser] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	// Custom hooks
	const { getItem, setItem, removeItem, clearUserData } = useLocalStorage();
	const {
		verifyToken,
		fetchDietPlan,
		fetchWeekPlan,
		saveWeekPlan,
		saveDietPlan,
		updateUser,
	} = useApi();

	const [pinnedPlans, setPinnedPlans] = useState(() => {
		return getItem(STORAGE_KEYS.pinnedPlans) || [];
	});

	// Load saved data from localStorage
	const loadSavedData = useCallback(() => {
		try {
			const savedDietPlan = getItem(STORAGE_KEYS.dietPlan);
			const savedWeekPlan = getItem(STORAGE_KEYS.weekPlan);
			const savedPlanId = getItem(STORAGE_KEYS.currentPlanId);

			if (savedDietPlan && savedPlanId) {
				setDietPlan(savedDietPlan);
				setPlanId(savedPlanId);
				
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
				// No active plan - always clear local data and go to landing
				clearUserData();
				setDietPlan(null);
				setWeekPlan({});
				setPlanId(null);
				setPageContent("landing");
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
					setItem(STORAGE_KEYS.currentPlanId, serverPlan.id);
				}

				// Try to fetch saved weekPlan for this user and plan
				try {
					const savedWeekPlan = await fetchWeekPlan(
						userData.id,
						userData.activeDietPlanId,
					);
					if (savedWeekPlan.weekPlan) {
						setWeekPlan(savedWeekPlan.weekPlan);
						setItem(STORAGE_KEYS.weekPlan, savedWeekPlan.weekPlan);
					} else {
						// No saved week plan, start with empty
						const emptyWeekPlan = createEmptyWeekPlan();
						setWeekPlan(emptyWeekPlan);
						setItem(STORAGE_KEYS.weekPlan, emptyWeekPlan);
					}
				} catch {
					// Reset weekPlan to empty on loading new dietPlan
					const emptyWeekPlan = createEmptyWeekPlan();
					setWeekPlan(emptyWeekPlan);
					setItem(STORAGE_KEYS.weekPlan, emptyWeekPlan);
				}

				// Always navigate to plan page when we have a valid diet plan
				setPageContent("plan");
			} catch {
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

	// Called on login success from LoginPage
	const onLoginSuccess = async (loggedInUser) => {
		setUser(loggedInUser);
		setIsAuthenticated(true);
		
		// Check if user has an active diet plan
		if (!loggedInUser.activeDietPlanId || loggedInUser.activeDietPlanId === "null") {
			// User has no active plan - clear all data and go to landing
			clearUserData();
			setDietPlan(null);
			setWeekPlan({});
			setPlanId(null);
			setPageContent("landing");
		} else {
			// First try localStorage (for existing clients)
			const savedDietPlan = getItem(STORAGE_KEYS.dietPlan);
			const savedPlanId = getItem(STORAGE_KEYS.currentPlanId);
			
			if (savedDietPlan && savedPlanId) {
				loadSavedData();
			} else {
				// For new clients: Try to fetch immediately, but handle token issues gracefully
				try {
					await fetchActiveDietPlan(loggedInUser, true); // Skip token check for now
				} catch {
					// Will be retried by the useEffect hook
				}
			}
		}
		
		setIsLoading(false);
	};

	// Save weekPlan to backend when it changes
	const saveWeekPlanToServer = useCallback(
		async (weekPlanData) => {
			if (!user?.id || !planId) return;

			try {
				await saveWeekPlan(user.id, planId, weekPlanData);
			} catch {
				// Silent fail - week plan will be saved locally
			}
		},
		[user?.id, planId, saveWeekPlan],
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

	useEffect(() => {
		if (planId) {
			setItem(STORAGE_KEYS.currentPlanId, planId);
		}
	}, [planId, setItem]);

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
		setItem(STORAGE_KEYS.currentPlanId, newPlanId);
		removeItem(STORAGE_KEYS.checkedItems);

		try {
			// First, save the diet plan to the backend
			const savedPlan = await postDietPlan(plan);

			// Then, update the user's activeDietPlanId to point to this plan
			if (user && savedPlan.id) {
				await updateUser(user.id, { activeDietPlanId: savedPlan.id });

				// Update local user state with the new activeDietPlanId
				setUser((prevUser) => ({
					...prevUser,
					activeDietPlanId: savedPlan.id,
				}));
			}
		} catch {
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
		setItem(STORAGE_KEYS.currentPlanId, pinnedPlan.planId);
		removeItem(STORAGE_KEYS.checkedItems);
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

		setDietPlan(null);
		setWeekPlan({});
		setPlanId(null);
		setPageContent("landing");
		setShowResetConfirmation(false);

		// Also clear the user's active diet plan from the backend
		try {
			if (user) {
				await updateUser(user.id, { activeDietPlanId: null });

				// Update local user state
				setUser((prevUser) => ({
					...prevUser,
					activeDietPlanId: null,
				}));
			}
		} catch {
			// Handle error silently
		}
	};

	const cancelReset = () => {
		setShowResetConfirmation(false);
	};

	const updateDietPlan = (updatedPlan) => {
		setDietPlan(updatedPlan);
	};

	const handleLogout = () => {
		removeItem(STORAGE_KEYS.token);
		setIsAuthenticated(false);
		setUser(null);
		setDietPlan(null);
		setWeekPlan({});
		setPlanId(null);
		setPageContent("landing");
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
								</div>
							</div>

							{pageContent !== "landing" && (
								<div
									className="flex space-x-2"
									role="toolbar"
									aria-label="Acciones del plan"
								>
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
										onClick={handleClearAndReset}
										className="px-4 py-2 bg-white text-indigo-600 rounded-md hover:bg-gray-50 transition-colors"
										aria-label="Reiniciar el plan actual y volver a la página principal"
									>
										Reiniciar Plan
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
						{pageContent === "landing" ? (
							<LandingPage
								handleDietPlanUpload={handleDietPlanUpload}
								handleRemovePinnedPlan={handleRemovePinnedPlan}
								pinnedPlans={pinnedPlans}
								handleLoadPinnedPlan={handleLoadPinnedPlan}
								handleRenamePinnedPlan={handleRenamePinnedPlan}
								handleLogout={handleLogout}
							/>
						) : pageContent === "plan" ? (
							<MealPlannerPage
								dietPlan={dietPlan}
								weekPlan={weekPlan}
								setWeekPlan={setWeekPlan}
								updateDietPlan={updateDietPlan}
							/>
						) : pageContent === "mealPrep" ? (
							<MealPrepPage weekPlan={weekPlan} />
						) : null}
					</main>

					{pageContent !== "landing" && (
						<footer className="bg-indigo-600 text-white p-4 shadow-md">
							<nav aria-label="Navegación principal">
								<ul className="flex justify-between items-center">
									<li>
										<button
											type="button"
											className="cursor-pointer hover:underline transition-all"
											onClick={() => setPageContent("landing")}
											aria-current={
												pageContent === "landing" ? "page" : undefined
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
				</div>
			</ToastProvider>
		</ErrorBoundary>
	);
}

export default App;
