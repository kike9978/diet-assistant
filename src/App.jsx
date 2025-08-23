import { useEffect, useState } from "react";
import LandingPage from "./components/LandingPage";
import MealPlannerPage from "./components/MealPlannerPage";
import MealPrepPage from "./components/MealPrepPage";
import { ToastProvider } from "./components/Toast";
import ResetConfirmationModal from "./components/ui/base/ResetConfirmationModal";

// 👇 Login form for demonstration
function LoginPage({ onLoginSuccess }) {
	const [isRegistering, setIsRegistering] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
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
					isRegistering
						? { name, email, password }
						: { email, password }
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
					onChange={(e) => setPassword(e.target.value)}
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

	// Fetch active diet plan from backend
	const fetchActiveDietPlan = async (userData) => {
		const token = localStorage.getItem("token");
		if (!token) return;

		try {
			const res = await fetch(`http://localhost:3000/api/users/${userData.id}/active-diet-plan`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!res.ok) throw new Error("No active diet plan found on server");

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
			
			// Set planId
			if (serverPlan.id) {
				setPlanId(serverPlan.id);
				localStorage.setItem("currentPlanId", serverPlan.id);
			} else {
				const newId = `plan_${Date.now()}`;
				setPlanId(newId);
				localStorage.setItem("currentPlanId", newId);
			}

			setPageContent("plan");
		} catch (err) {
			console.warn("Failed to fetch diet plan from server, loading from localStorage", err);
			// Fallback to localStorage if server fails
			loadSavedData();
		}
	};

	// FIXED: Single useEffect for authentication and data loading
	useEffect(() => {
		const initializeApp = async () => {
			const token = localStorage.getItem("token");
			if (!token) {
				setIsLoading(false);
				return;
			}

			try {
				// Verify token
				const res = await fetch("http://localhost:3000/api/auth/verify", {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!res.ok) throw new Error("Token invalid");

				const data = await res.json();
				setUser(data.user);
				setIsAuthenticated(true);

				// After successful authentication, load the user's data
				await fetchActiveDietPlan(data.user);

			} catch (err) {
				console.warn("Auth failed:", err.message);
				localStorage.removeItem("token");
				setIsAuthenticated(false);
				setUser(null);
			} finally {
				setIsLoading(false);
			}
		};

		initializeApp();
	}, []);

	// Called on login success from LoginPage
	const onLoginSuccess = async (loggedInUser) => {
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

	const postDietPlan = async (plan) => {
		const token = localStorage.getItem("token");
		const response = await fetch("http://localhost:3000/api/dietplans", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(plan),
		});
		if (!response.ok) throw new Error("Failed to upload diet plan");
		return await response.json();
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
			await postDietPlan(plan);
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
				plan.id === pinnedPlanId ? { ...plan, name: newName } : plan
			)
		);
	};

	const handleClearAndReset = () => {
		setShowResetConfirmation(true);
	};

	const confirmReset = () => {
		localStorage.removeItem("dietPlan");
		localStorage.removeItem("weekPlan");
		localStorage.removeItem("currentPlanId");
		localStorage.removeItem("checkedItems");

		setDietPlan(null);
		setWeekPlan({});
		setPlanId(null);
		setPageContent("landing");
		setShowResetConfirmation(false);
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

	if (isLoading) return <div className="p-4">Cargando...</div>;

	if (!isAuthenticated) {
		return <LoginPage onLoginSuccess={onLoginSuccess} />;
	}

	// 👇 Main App Content
	return (
		<ToastProvider>
			<div className="h-screen max-h-[100dvh] bg-gray-100 flex flex-col overflow-hidden">
				<header className="bg-indigo-600 text-white p-4 shadow-md">
					<div className="container mx-auto flex justify-between items-center">
						<h1 className="text-2xl font-bold">Plan Alimenticio</h1>

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
								<button className="cursor-pointer" onClick={() => setPageContent("landing")}>
									Home
								</button>
							</li>
							<li>
								<button className="cursor-pointer" onClick={() => setPageContent("plan")}>
									Meal Planning
								</button>
							</li>
							<li>
								<button className="cursor-pointer" onClick={() => setPageContent("mealPrep")}>
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