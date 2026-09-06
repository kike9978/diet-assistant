import {
	BrowserRouter,
	Navigate,
	Route,
	Routes,
	useSearchParams,
} from "react-router-dom";
import { AppStateProvider, useAppState } from "./context/AppState";
import { AppI18nProvider } from "./i18n";
import { ToastProvider } from "./components/Toast";
import AppShell from "./components/shell/AppShell";
import ShoppingPage from "./features/shopping/ShoppingPage";
import CalendarPage from "./pages/CalendarPage";
import CreateMealPage from "./pages/CreateMealPage";
import FamilyPage from "./pages/FamilyPage";
import MealDetailPage from "./pages/MealDetailPage";
import MealsPage from "./pages/MealsPage";
import MorePage from "./pages/MorePage";
import PantryPage from "./pages/PantryPage";
import PlansPage from "./pages/PlansPage";
import PrepPage from "./pages/PrepPage";
import SettingsPage from "./pages/SettingsPage";
import ToolsPage from "./pages/ToolsPage";
import WeekPlanPage from "./pages/WeekPlanPage";

/** Old Compras tab URL → dedicated Prep route. */
function ShoppingRoute() {
	const [params] = useSearchParams();
	if (params.get("mode") === "prep") {
		return <Navigate to="/prep" replace />;
	}
	return <ShoppingPage />;
}

function LocaleGate({ children }) {
	const { state } = useAppState();
	return (
		<AppI18nProvider locale={state.settings.locale}>{children}</AppI18nProvider>
	);
}

function AppRoutes() {
	return (
		<Routes>
			<Route element={<AppShell />}>
				<Route index element={<CalendarPage />} />
				<Route path="plan/week" element={<WeekPlanPage />} />
				<Route path="meals" element={<MealsPage />} />
				<Route path="meals/new" element={<CreateMealPage />} />
				<Route path="meals/:id" element={<MealDetailPage />} />
				<Route path="shopping" element={<ShoppingRoute />} />
				<Route path="prep" element={<PrepPage />} />
				<Route path="pantry" element={<PantryPage />} />
				<Route path="plans" element={<PlansPage />} />
				<Route path="family" element={<FamilyPage />} />
				<Route path="tools" element={<ToolsPage />} />
				<Route path="settings" element={<SettingsPage />} />
				<Route path="more" element={<MorePage />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Route>
		</Routes>
	);
}

export default function App() {
	return (
		<BrowserRouter>
			<AppStateProvider>
				<LocaleGate>
					<ToastProvider>
						<AppRoutes />
					</ToastProvider>
				</LocaleGate>
			</AppStateProvider>
		</BrowserRouter>
	);
}
