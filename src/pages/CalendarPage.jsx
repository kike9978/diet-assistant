import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import {
	parseDateISO,
	toDateISO,
	weekDateISOs,
} from "../features/calendar/dateUtils.js";
import { DAY_SHORT_MSG } from "../i18n/weekDayLabels";
import FirstRun from "../components/FirstRun";
import MealPlanner from "../components/MealPlanner";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";

const TYPE_COLOR = {
	desayuno: "var(--color-accent-breakfast)",
	colacion: "var(--color-accent-snack)",
	comida: "var(--color-accent-lunch)",
	merienda: "var(--color-accent-snack)",
	cena: "var(--color-accent-dinner)",
	otro: "var(--color-ink-muted)",
};

function WeekSurface() {
	const { state, setCalendarCursorDate } = useAppState();
	const { _ } = useLingui();
	const memberId = state.household.activeMemberId;
	const cal = state.calendars[memberId] || {};
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const dates = weekDateISOs(state.ui.calendarCursorDate, weekStartsOn);

	const shiftWeek = (delta) => {
		const d = parseDateISO(state.ui.calendarCursorDate);
		d.setDate(d.getDate() + delta * 7);
		setCalendarCursorDate(toDateISO(d));
	};

	const dayKeys = [
		"sunday",
		"monday",
		"tuesday",
		"wednesday",
		"thursday",
		"friday",
		"saturday",
	];

	return (
		<section className="mb-6">
			<div className="flex items-center justify-between gap-2 mb-3">
				<h2 className="font-display text-xl text-ink">
					<Trans>Esta semana</Trans>
				</h2>
				<div className="flex gap-2">
					<Button variant="secondary" onClick={() => shiftWeek(-1)}>
						←
					</Button>
					<Button
						variant="secondary"
						onClick={() => setCalendarCursorDate(toDateISO(new Date()))}
					>
						<Trans>Hoy</Trans>
					</Button>
					<Button variant="secondary" onClick={() => shiftWeek(1)}>
						→
					</Button>
				</div>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
				{dates.map((dateISO) => {
					const d = parseDateISO(dateISO);
					const meals = cal[dateISO] || [];
					return (
						<div
							key={dateISO}
							className="bg-surface border border-border rounded-app p-3 min-h-28"
						>
							<p className="text-xs font-semibold text-ink-muted mb-2">
								{_(DAY_SHORT_MSG[dayKeys[d.getDay()]])}{" "}
								<span className="text-ink">{d.getDate()}</span>
							</p>
							<ul className="space-y-1">
								{meals.map((meal) => (
									<li
										key={meal.instanceId}
										className="text-xs font-semibold px-2 py-1 rounded-md text-white truncate"
										style={{
											backgroundColor:
												TYPE_COLOR[meal.mealType] || TYPE_COLOR.otro,
										}}
										title={meal.name}
									>
										{meal.name}
									</li>
								))}
							</ul>
						</div>
					);
				})}
			</div>
		</section>
	);
}

export default function CalendarPage() {
	const { hasContent, dietPlan, weekPlan, setWeekPlan, state } = useAppState();
	const navigate = useNavigate();
	const showOnboarding = !state.ui.onboardingDismissed && !hasContent;

	if (!hasContent) {
		return (
			<div>
				{showOnboarding ? <FirstRun /> : null}
				<EmptyState
					title={<Trans>Empieza por una comida</Trans>}
					description={
						<Trans>
							Crea una comida mínima o importa un plan JSON. Luego la verás en
							tu semana.
						</Trans>
					}
					actionLabel={<Trans>Crear comida</Trans>}
					onAction={() => navigate("/meals/new")}
				/>
				<div className="text-center mt-4">
					<Link to="/plans" className="text-brand font-semibold underline">
						<Trans>O importa un plan JSON</Trans>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div>
			{showOnboarding ? <FirstRun /> : null}
			<div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
				<h1 className="font-display text-2xl text-ink">
					<Trans>Calendario</Trans>
				</h1>
				<div className="flex gap-2">
					<Button variant="secondary" onClick={() => navigate("/meals/new")}>
						<Trans>Crear comida</Trans>
					</Button>
					<Button onClick={() => navigate("/shopping")}>
						<Trans>Ir a compras</Trans>
					</Button>
				</div>
			</div>

			<WeekSurface />

			{dietPlan ? (
				<div className="mt-4">
					<h2 className="font-display text-lg mb-3">
						<Trans>Asignar plantillas al plan semanal</Trans>
					</h2>
					<MealPlanner
						dietPlan={dietPlan}
						weekPlan={weekPlan}
						setWeekPlan={setWeekPlan}
					/>
				</div>
			) : (
				<p className="text-sm text-ink-muted">
					<Trans>
						No hay plantillas de días. Puedes{" "}
						<Link to="/plans" className="text-brand underline">
							importar un plan
						</Link>{" "}
						o seguir añadiendo comidas sueltas.
					</Trans>
				</p>
			)}
		</div>
	);
}
