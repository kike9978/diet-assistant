import { useEffect, useState } from "react";
import LandingPage from "./components/LandingPage";
import MealPlannerPage from "./components/MealPlannerPage";
import MealPrepPage from "./components/MealPrepPage";
import { ToastProvider } from "./components/Toast";
import ResetConfirmationModal from "./components/ui/base/ResetConfirmationModal";

// 👇 Login form for demonstration
function LoginPage({ onLoginSuccess }) {
	const [isRegistering, setIsRegistering] = useState(false);
	const [email, setEmail] = useState("juan2@example.com");
	const [password, setPassword] = useState("123456789");
	const [name, setName] = useState(""); // Only used for registration
	const [error, setError] = useState("");

	const toggleMode = () => {
		setIsRegistering((prev) => !prev);
		setError("");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const endpoint = isRegistering ? "register" : "login";

		try {
			const res = await fetch(`http://localhost:3000/api/auth/${endpoint}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(
					isRegistering ? { name, email, password } : { email, password },
				),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Request failed");
			}

			const data = await res.json();
			localStorage.setItem("token", data.token);
			onLoginSuccess(data.user);
		} catch (err) {
			setError(err.message || "Something went wrong");
		}
	};

	return (
		<div className="flex h-screen items-center justify-center bg-gray-100">
			<form
				onSubmit={handleSubmit}
				className="bg-white p-8 rounded shadow-md w-full max-w-sm"
			>
				<h2 className="text-2xl font-bold mb-4 text-center">
					{isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}
				</h2>

				{error && (
					<p className="text-red-500 text-sm mb-4 text-center">{error}</p>
				)}

				{isRegistering && (
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Nombre"
						className="w-full p-2 border mb-3 rounded"
						required
					/>
				)}

				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="Email"
					className="w-full p-2 border mb-3 rounded"
					required
				/>

				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.parameter.value)}
					placeholder="Contraseña"
					className="w-full p-2 border mb-4 rounded"
					required
				/>

				<button
					type="submit"
					className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-500"
				>
					{isRegistering ? "Registrarse" : "Entrar"}
				</button>

				<p className="mt-4 text-sm text-center text-gray-600">
					{isRegistering ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta?"}{" "}
					<button
						type="button"
						onClick={toggleMode}
						className="text-indigo-600 hover:underline ml-1"
					>
						{isRegistering ? "Iniciar sesión" : "Registrarse"}
					</button>
				</p>
			</form>
		</div>
	);
}

function App() {
	const [dietPlan, setDietPlan] = useState(null);
	const [weekPlan, setWeekPlan] = useState({});
	const [pageContent, setPageContent] = useState("landing");
	const [showResetConfirmation, setShowResetConfirmation] = useState(false);
	const [pinnedPlans, setPinnedPlans] = useState(() => {
		const savedPinnedPlans = localStorage.getItem("pinnedPlans");
		return savedPinnedPlans ? JSON.parse(savedPinnedPlans) : [];
	});
	const [planId, setPlanId] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [user, setUser] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	console.log("Current user:", user);
	console.log("User activeDietPlanId:", user?.activeDietPlanId);

	// Load saved data from localStorage
	const loadSavedData = () => {
		try {
			const savedDietPlan = localStorage.getItem("dietPlan");
			const savedWeekPlan = localStorage.getItem("weekPlan");
			const savedPlanId = localStorage.getItem("currentPlanId");

			if (savedDietPlan && savedWeekPlan && savedPlanId) {
				setDietPlan(JSON.parse(savedDietPlan));
				setWeekPlan(JSON.parse(savedWeekPlan));
				setPlanId(savedPlanId);
				setPageContent("plan");
			}
		} catch (error) {
			console.error("Error loading saved data:", error);
			// Clear corrupted data
			localStorage.removeItem("dietPlan");
			localStorage.removeItem("weekPlan");
			localStorage.removeItem("currentPlanId");
			localStorage.removeItem("checkedItems");
		}
	};

	// Fetch active diet plan from backend using activeDietPlanId
	const fetchActiveDietPlan = async (userData) => {
		const token = localStorage.getItem("token");
		if (!token) return;

		// Check if user has an activeDietPlanId
		if (!userData.activeDietPlanId || userData.activeDietPlanId === "null") {
			console.log("No active diet plan ID found for user");
			
			// Check if we're offline by trying to reach the server
			try {
				await fetch("http://localhost:3000/api/auth/verify", {
					method: "HEAD", // Just check connection, don't need response body
					headers: { Authorization: `Bearer ${token}` },
				});
				
				// If we reach here, we have internet connection but no active plan
				// Clear local data and show landing page
				console.log("Online but no active plan - clearing local data");
				localStorage.removeItem("dietPlan");
				localStorage.removeItem("weekPlan");
				localStorage.removeItem("currentPlanId");
				localStorage.removeItem("checkedItems");
				
				setDietPlan(null);
				setWeekPlan({});
				setPlanId(null);
				setPageContent("landing");
			} catch (networkError) {
				// Network error - we're offline, fallback to localStorage
				console.log("Offline mode - loading from localStorage");
				loadSavedData();
			}
			return;
		}

		try {
			// Fetch the specific diet plan using the activeDietPlanId
			const res = await fetch(
				`http://localhost:3000/api/dietplans/${userData.activeDietPlanId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (!res.ok) throw new Error("Diet plan not found on server");

			const serverPlan = await res.json();
			setDietPlan(serverPlan);
			localStorage.setItem("dietPlan", JSON.stringify(serverPlan));

			// Reset weekPlan to empty on loading new dietPlan
			const emptyWeekPlan = {
				monday: [],
				tuesday: [],
				wednesday: [],
				thursday: [],
				friday: [],
				saturday: [],
				sunday: [],
			};
			setWeekPlan(emptyWeekPlan);
			localStorage.setItem("weekPlan", JSON.stringify(emptyWeekPlan));

			// Set planId from the fetched plan
			if (serverPlan.id) {
				setPlanId(serverPlan.id);
				localStorage.setItem("currentPlanId", serverPlan.id);
			}

			setPageContent("plan");
			console.log("Successfully loaded diet plan from server:", serverPlan);
		} catch (err) {
			console.warn(
				"Failed to fetch diet plan from server, loading from localStorage",
				err,
			);
			// Fallback to localStorage if server fails
			loadSavedData();
		}
	};

	// FIXED: Single useEffect for authentication and data loading
	useEffect(() => {
		const initializeApp = async () => {
			const token = localStorage.getItem("token");
			console.log("Initializing app with token:", !!token);
			
			if (!token) {
				setIsLoading(false);
				return;
			}

			try {
				// Verify token - use correct endpoint
				const res = await fetch("http://localhost:3000/api/auth/verify", {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!res.ok) {
					const errorData = await res.json().catch(() => ({}));
					throw new Error(
						errorData.error || `Token verification failed: ${res.status}`,
					);
				}

				const data = await res.json();
				console.log("Auth verification response:", data);
				
				// FIXED: Make sure to store the complete user data including activeDietPlanId
				setUser(data.user);
				setIsAuthenticated(true);

				// After successful authentication, try to load the user's data
				try {
					await fetchActiveDietPlan(data.user);
				} catch (planError) {
					console.warn("Could not load diet plan:", planError.message);
					// Still authenticated, just load from localStorage as fallback
					loadSavedData();
				}
			} catch (err) {
				console.warn("Auth failed:", err.message);
				localStorage.removeItem("token");
				setIsAuthenticated(false);
				setUser(null);
				// Clear all user data on auth failure
				localStorage.removeItem("dietPlan");
				localStorage.removeItem("weekPlan");
				localStorage.removeItem("currentPlanId");
				localStorage.removeItem("checkedItems");
			} finally {
				setIsLoading(false);
			}
		};

		initializeApp();
	}, []);

	// Called on login success from LoginPage
	const onLoginSuccess = async (loggedInUser) => {
		console.log("Login success with user:", loggedInUser);
		setUser(loggedInUser);
		setIsAuthenticated(true);
		await fetchActiveDietPlan(loggedInUser);
		setIsLoading(false);
	};

	// Save data to localStorage when state changes
	useEffect(() => {
		if (dietPlan) {
			localStorage.setItem("dietPlan", JSON.stringify(dietPlan));
		}
	}, [dietPlan]);

	useEffect(() => {
		if (Object.keys(weekPlan).length > 0) {
			localStorage.setItem("weekPlan", JSON.stringify(weekPlan));
		}
	}, [weekPlan]);

	useEffect(() => {
		if (planId) {
			localStorage.setItem("currentPlanId", planId);
		}
	}, [planId]);

	useEffect(() => {
		if (pinnedPlans.length > 0) {
			localStorage.setItem("pinnedPlans", JSON.stringify(pinnedPlans));
		}
	}, [pinnedPlans]);

	const postDietPlan = async (plan, userId) => {
		try {
			const token = localStorage.getItem("token");
			if (!token) throw new Error("No authentication token found");
	
			const headers = {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			};
	
			// STEP 1: Upload the diet plan
			const postResponse = await fetch("http://localhost:3000/api/dietplans", {
				method: "POST",
				headers,
				body: JSON.stringify(plan),
			});
	
			if (!postResponse.ok) {
				const errorData = await postResponse.json().catch(() => ({}));
				throw new Error(`Failed to upload diet plan: ${errorData.message || postResponse.statusText}`);
			}
	
			const createdPlan = await postResponse.json();
	
			if (!createdPlan?.id) {
				throw new Error("No 'id' returned in created diet plan");
			}
			console.log("Created plan:", createdPlan);
	
			return createdPlan;
	
		} catch (error) {
			console.error("Error in postDietPlan:", error);
			throw error;
		}
	};

	const handleDietPlanUpload = async (plan) => {
		const newPlanId = `plan_${Date.now()}`;
		setDietPlan(plan);
		setWeekPlan({});
		setPlanId(newPlanId);
		setPageContent("plan");

		localStorage.setItem("weekPlan", JSON.stringify({}));
		localStorage.setItem("currentPlanId", newPlanId);
		localStorage.removeItem("checkedItems");

		try {
			// First, save the diet plan to the backend
			const savedPlan = await postDietPlan(plan, user.id);

			// Then, update the user's activeDietPlanId to point to this plan
			if (user && savedPlan.id) {
				const token = localStorage.getItem("token");
				console.log("Updating user activeDietPlanId to:", savedPlan.id);
				
				const updateResponse = await fetch(`http://localhost:3000/api/users/${user.id}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						activeDietPlanId: savedPlan.id,
					}),
				});

				if (updateResponse.ok) {
					// FIXED: Update local user state with the new activeDietPlanId
					setUser((prevUser) => ({
						...prevUser,
						activeDietPlanId: savedPlan.id,
					}));
					console.log("Successfully updated user activeDietPlanId");
				} else {
					console.error("Failed to update user activeDietPlanId");
				}
			}
		} catch (error) {
			console.error("Failed to save plan to database:", error);
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
		const cleanWeekPlan = {
			monday: [],
			tuesday: [],
			wednesday: [],
			thursday: [],
			friday: [],
			saturday: [],
			sunday: [],
		};
		setWeekPlan(cleanWeekPlan);
		setPlanId(pinnedPlan.planId);
		setPageContent("plan");

		localStorage.setItem("dietPlan", JSON.stringify(pinnedPlan.dietPlan));
		localStorage.setItem("weekPlan", JSON.stringify(cleanWeekPlan));
		localStorage.setItem("currentPlanId", pinnedPlan.planId);
		localStorage.removeItem("checkedItems");
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
		localStorage.removeItem("dietPlan");
		localStorage.removeItem("weekPlan");
		localStorage.removeItem("currentPlanId");
		localStorage.removeItem("checkedItems");

		setDietPlan(null);
		setWeekPlan({});
		setPlanId(null);
		setPageContent("landing");
		setShowResetConfirmation(false);

		// Also clear the user's active diet plan from the backend
		try {
			if (user) {
				console.log("Clearing user activeDietPlanId");
				const token = localStorage.getItem("token");
				const response = await fetch(`http://localhost:3000/api/users/${user.id}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						activeDietPlanId: null, // Changed from "null" string to null
					}),
				});

				if (response.ok) {
					// FIXED: Update local user state
					setUser((prevUser) => ({
						...prevUser,
						activeDietPlanId: null,
					}));
					console.log("Successfully cleared activeDietPlanId");
				} else {
					console.error("Failed to clear activeDietPlanId from backend");
				}
			}
		} catch (error) {
			console.error("Failed to clear active diet plan from backend:", error);
		}
	};

	const cancelReset = () => {
		setShowResetConfirmation(false);
	};

	const updateDietPlan = (updatedPlan) => {
		setDietPlan(updatedPlan);
	};

	const handleLogout = () => {
		localStorage.removeItem("token");
		setIsAuthenticated(false);
		setUser(null);
		setDietPlan(null);
		setWeekPlan({});
		setPlanId(null);
		setPageContent("landing");
	};

	// Add some debugging
	if (isLoading) {
		return (
			<div className="p-4">
				<div>Cargando...</div>
				<div className="text-sm text-gray-500 mt-2">
					Token exists: {localStorage.getItem("token") ? "Yes" : "No"}
				</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return <LoginPage onLoginSuccess={onLoginSuccess} />;
	}

	// 👇 Main App Content
	return (
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
							<div className="flex space-x-2">
								<button
									onClick={handlePinCurrentPlan}
									className="px-4 py-2 bg-indigo-500 text-white rounded-md"
								>
									Guardar Plan
								</button>
								<button
									onClick={handleClearAndReset}
									className="px-4 py-2 bg-white text-indigo-600 rounded-md"
								>
									Reiniciar Plan
								</button>
								<button
									onClick={handleLogout}
									className="px-4 py-2 bg-red-500 text-white rounded-md"
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
						<ul className="flex justify-between items-center">
							<li>
								<button
									className="cursor-pointer"
									onClick={() => setPageContent("landing")}
								>
									Home
								</button>
							</li>
							<li>
								<button
									className="cursor-pointer"
									onClick={() => setPageContent("plan")}
								>
									Meal Planning
								</button>
							</li>
							<li>
								<button
									className="cursor-pointer"
									onClick={() => setPageContent("mealPrep")}
								>
									Meal Prep
								</button>
							</li>
						</ul>
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
	);
}

export default App;