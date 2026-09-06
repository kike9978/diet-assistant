import { useEffect, useState } from "react";
import { Trans } from "@lingui/react/macro";
import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import CalendarChrome from "../features/calendar/CalendarChrome";
import DayView from "../features/calendar/DayView";
import MonthView from "../features/calendar/MonthView";
import WeekView from "../features/calendar/WeekView";
import {
	todayISO,
	weekDateISOs,
} from "../features/calendar/dateUtils.js";
import FirstRun from "../components/FirstRun";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";

function normalizeCalendarView(view) {
	return view === "month" ? "month" : "week";
}

function defaultSelectedDate(cursorDate, weekStartsOn) {
	const today = todayISO();
	const week = weekDateISOs(cursorDate, weekStartsOn);
	if (week.includes(today)) return today;
	return week[0];
}

export default function CalendarPage() {
	const {
		hasContent,
		state,
		setCalendarCursorDate,
		setCalendarView,
		prunePastWeeks,
	} = useAppState();
	const navigate = useNavigate();
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const cursor = state.ui.calendarCursorDate;
	const view = normalizeCalendarView(
		state.ui.calendarView || state.settings.calendarDefaultView || "week",
	);
	const showOnboarding = !state.ui.onboardingDismissed && !hasContent;

	const [selectedDateISO, setSelectedDateISO] = useState(() =>
		defaultSelectedDate(cursor, weekStartsOn),
	);
	const [pruneOpen, setPruneOpen] = useState(false);

	useEffect(() => {
		const week = weekDateISOs(cursor, weekStartsOn);
		if (view === "week" && !week.includes(selectedDateISO)) {
			setSelectedDateISO(defaultSelectedDate(cursor, weekStartsOn));
		}
	}, [cursor, weekStartsOn, selectedDateISO, view]);

	const handleSelectDate = (dateISO, nextView) => {
		setSelectedDateISO(dateISO);
		setCalendarCursorDate(dateISO);
		if (nextView) setCalendarView(normalizeCalendarView(nextView));
	};

	const handleOpenMeal = (meal) => {
		handleSelectDate(meal.dateISO);
	};

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
				<div className="flex gap-2 flex-wrap">
					<Button variant="secondary" onClick={() => navigate("/meals/new")}>
						<Trans>Crear comida</Trans>
					</Button>
					<Button onClick={() => navigate("/shopping")}>
						<Trans>Ir a compras</Trans>
					</Button>
				</div>
			</div>

			<CalendarChrome
				view={view}
				cursorDate={cursor}
				weekStartsOn={weekStartsOn}
				onViewChange={(v) => setCalendarView(normalizeCalendarView(v))}
				onCursorChange={setCalendarCursorDate}
				onToday={(iso) => setSelectedDateISO(iso)}
			/>

			{view === "month" ? (
				<MonthView
					onSelectDate={(dateISO) => handleSelectDate(dateISO, "week")}
				/>
			) : (
				<>
					<WeekView
						selectedDateISO={selectedDateISO}
						onSelectDate={(iso) => handleSelectDate(iso)}
						onOpenMeal={handleOpenMeal}
					/>
					<DayView dateISO={selectedDateISO} />
				</>
			)}

			<div className="mt-6 pt-4 border-t border-border">
				<button
					type="button"
					className="text-sm text-ink-muted underline hover:text-ink"
					onClick={() => setPruneOpen(true)}
				>
					<Trans>Limpiar semanas pasadas</Trans>
				</button>
				<p className="text-xs text-ink-muted mt-1">
					<Trans>
						Borra comidas agendadas de hace más de ~4 meses. Biblioteca y
						plantillas no se tocan.
					</Trans>
				</p>
			</div>

			<ConfirmDialog
				open={pruneOpen}
				danger
				title={<Trans>Limpiar semanas pasadas</Trans>}
				description={
					<Trans>
						¿Borrar del calendario todo lo anterior a hace unos 4 meses? No
						afecta biblioteca ni plantillas.
					</Trans>
				}
				confirmLabel={<Trans>Limpiar</Trans>}
				onConfirm={() => {
					prunePastWeeks({ keepMonths: 4 });
					setPruneOpen(false);
				}}
				onCancel={() => setPruneOpen(false)}
			/>
		</div>
	);
}
