import { useEffect, useState } from "react";
import { Trans } from "@lingui/react/macro";
import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import CalendarChrome from "../features/calendar/CalendarChrome";
import DayView from "../features/calendar/DayView";
import MonthView from "../features/calendar/MonthView";
import WeekView from "../features/calendar/WeekView";
import WeekAssignBar from "../features/calendar/WeekAssignBar";
import {
	todayISO,
	weekDateISOs,
} from "../features/calendar/dateUtils.js";
import FirstRun from "../components/FirstRun";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";

function normalizeCalendarView(view) {
	return view === "week" ? "week" : "month";
}

function defaultSelectedDate(cursorDate, weekStartsOn) {
	const today = todayISO();
	const week = weekDateISOs(cursorDate, weekStartsOn);
	if (week.includes(today)) return today;
	return week[0];
}

/**
 * Mes: week rows + edit week plan. Semana: WeekView + DayView —
 * assign day plans to the selected day, then tweak meals.
 */
export default function CalendarPage() {
	const {
		hasContent,
		state,
		activeMember,
		setCalendarCursorDate,
		setCalendarView,
		prunePastWeeks,
	} = useAppState();
	const navigate = useNavigate();
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const cursor = state.ui.calendarCursorDate;
	const view = normalizeCalendarView(
		state.ui.calendarView || state.settings.calendarDefaultView || "month",
	);
	const showOnboarding = !state.ui.onboardingDismissed && !hasContent;

	const [selectedDateISO, setSelectedDateISO] = useState(() =>
		defaultSelectedDate(cursor, weekStartsOn),
	);
	const [pruneOpen, setPruneOpen] = useState(false);

	useEffect(() => {
		if (view !== "week") return;
		const week = weekDateISOs(cursor, weekStartsOn);
		if (!week.includes(selectedDateISO)) {
			setSelectedDateISO(defaultSelectedDate(cursor, weekStartsOn));
		}
	}, [cursor, weekStartsOn, selectedDateISO, view]);

	const weekStartISO = weekDateISOs(cursor, weekStartsOn)[0];

	const handleSelectDateFromMonth = (dateISO) => {
		setSelectedDateISO(dateISO);
		setCalendarCursorDate(dateISO);
		setCalendarView("week");
	};

	const handleSelectDate = (dateISO) => {
		setSelectedDateISO(dateISO);
		setCalendarCursorDate(dateISO);
	};

	const handleOpenMeal = (meal) => {
		handleSelectDate(meal.dateISO);
	};

	return (
		<div>
			{showOnboarding ? <FirstRun /> : null}

			<div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
				<h1 className="font-display text-2xl text-ink">
					<Trans>Calendario</Trans>
				</h1>
				<Button onClick={() => navigate("/shopping")}>
					<Trans>Ir a compras</Trans>
				</Button>
			</div>

			<CalendarChrome
				view={view}
				cursorDate={cursor}
				weekStartsOn={weekStartsOn}
				onViewChange={(v) => setCalendarView(normalizeCalendarView(v))}
				onCursorChange={setCalendarCursorDate}
				onToday={(iso) => setSelectedDateISO(iso)}
				activeMember={activeMember}
			/>

			{view === "week" ? (
				<>
					<WeekAssignBar weekStartISO={weekStartISO} />
					<WeekView
						selectedDateISO={selectedDateISO}
						onSelectDate={handleSelectDate}
						onOpenMeal={handleOpenMeal}
					/>
					<DayView dateISO={selectedDateISO} />
				</>
			) : (
				<MonthView
					selectedDateISO={selectedDateISO}
					onSelectDate={handleSelectDateFromMonth}
				/>
			)}

			{!hasContent ? (
				<p className="text-center text-sm text-ink-muted mt-4">
					<Link to="/plans" className="text-brand font-semibold underline">
						<Trans>Importar un plan JSON</Trans>
					</Link>
					{" · "}
					<Link to="/meals/new" className="underline">
						<Trans>Crear comida</Trans>
					</Link>
				</p>
			) : null}

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
