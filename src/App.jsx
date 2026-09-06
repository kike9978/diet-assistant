import { Trans } from "@lingui/react/macro";
import { useMemo, useState } from "react";
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
import Button from "./components/ui/Button";
import ConfirmDialog from "./components/ui/ConfirmDialog";
import ShoppingPage from "./features/shopping/ShoppingPage";
import CalendarPage from "./pages/CalendarPage";
import CreateMealPage from "./pages/CreateMealPage";
import FamilyPage from "./pages/FamilyPage";
import MealDetailPage from "./pages/MealDetailPage";
import MealsPage from "./pages/MealsPage";
import MorePage from "./pages/MorePage";
import PantryPage from "./pages/PantryPage";
import PlansPage from "./pages/PlansPage";
import SettingsPage from "./pages/SettingsPage";
import ToolsPage from "./pages/ToolsPage";
import WeekPlanPage from "./pages/WeekPlanPage";

function ShoppingRoute() {
	const [params] = useSearchParams();
	const mode = params.get("mode") === "prep" ? "prep" : "lista";
	return <ShoppingPage mode={mode} />;
}

function LocaleGate({ children }) {
	const { state } = useAppState();
	return (
		<AppI18nProvider locale={state.settings.locale}>{children}</AppI18nProvider>
	);
}

function ShellWithActions() {
	const { reiniciar, saveCurrentAsTemplate, hasContent } = useAppState();
	const [confirmOpen, setConfirmOpen] = useState(false);

	const actions = useMemo(() => {
		if (!hasContent) return null;
		return (
			<>
				<Button
					variant="secondary"
					className="!bg-white/15 !text-white !border-white/30 hover:!bg-white/25 hidden sm:inline-flex"
					onClick={() => saveCurrentAsTemplate()}
				>
					<Trans>Guardar plantilla</Trans>
				</Button>
				<Button
					variant="secondary"
					className="!bg-white !text-brand hover:!bg-surface-2"
					onClick={() => setConfirmOpen(true)}
				>
					<Trans>Reiniciar</Trans>
				</Button>
			</>
		);
	}, [hasContent, saveCurrentAsTemplate]);

	return (
		<>
			<AppShell headerActions={actions} />
			<ConfirmDialog
				open={confirmOpen}
				danger
				title={<Trans>Reiniciar plan</Trans>}
				description={
					<Trans>
						Se borrarán calendarios, checklist, prep y extras. Biblioteca y
						plantillas se conservan.
					</Trans>
				}
				confirmLabel={<Trans>Reiniciar</Trans>}
				onConfirm={() => {
					reiniciar();
					setConfirmOpen(false);
				}}
				onCancel={() => setConfirmOpen(false)}
			/>
		</>
	);
}

function AppRoutes() {
	return (
		<Routes>
			<Route element={<ShellWithActions />}>
				<Route index element={<CalendarPage />} />
				<Route path="plan/week" element={<WeekPlanPage />} />
				<Route path="meals" element={<MealsPage />} />
				<Route path="meals/new" element={<CreateMealPage />} />
				<Route path="meals/:id" element={<MealDetailPage />} />
				<Route path="shopping" element={<ShoppingRoute />} />
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
