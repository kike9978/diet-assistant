import { useEffect, useMemo, useState } from "react";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import { useToast } from "../components/Toast";
import CalendarChrome from "../features/calendar/CalendarChrome";
import DayView from "../features/calendar/DayView";
import MonthView from "../features/calendar/MonthView";
import WeekView from "../features/calendar/WeekView";
import {
	todayISO,
	weekDateISOs,
} from "../features/calendar/dateUtils.js";
import OnboardingModal from "../components/OnboardingModal";
import Button from "../components/ui/Button";
import { getWeekReadiness } from "../features/weekplan/weekReadiness.js";

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
		fillEmptyWeekDays,
	} = useAppState();
	const navigate = useNavigate();
	const toast = useToast();
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const cursor = state.ui.calendarCursorDate;
	const view = normalizeCalendarView(
		state.ui.calendarView || state.settings.calendarDefaultView || "month",
	);
	const showOnboarding = !state.ui.onboardingDismissed && !hasContent;

	const [selectedDateISO, setSelectedDateISO] = useState(() =>
		defaultSelectedDate(cursor, weekStartsOn),
	);

	useEffect(() => {
		if (view !== "week") return;
		const week = weekDateISOs(cursor, weekStartsOn);
		if (!week.includes(selectedDateISO)) {
			setSelectedDateISO(defaultSelectedDate(cursor, weekStartsOn));
		}
	}, [cursor, weekStartsOn, selectedDateISO, view]);

	const weekStartISO = weekDateISOs(cursor, weekStartsOn)[0];

	const readiness = useMemo(
		() => getWeekReadiness(state, weekStartISO),
		[state, weekStartISO],
	);

	const handleSelectDateFromMonth = (dateISO) => {
		setSelectedDateISO(dateISO);
		setCalendarCursorDate(dateISO);
		setCalendarView("week");
	};

	const handleSelectDate = (dateISO) => {
		setSelectedDateISO(dateISO);
		setCalendarCursorDate(dateISO);
	};

	const handleFillEmpty = () => {
		const n = fillEmptyWeekDays(weekStartISO);
		if (n > 0) {
			toast?.success?.(t`${n} días asignados`);
			setCalendarView("week");
		}
	};

	const weekPlanPath = `/plan/week?week=${encodeURIComponent(weekStartISO)}`;

	return (
		<div>
			<OnboardingModal open={showOnboarding} />

			<div className="flex items-center justify-between gap-3 mb-3">
				<h1 className="font-display text-xl text-ink">
					<Trans>Calendario</Trans>
				</h1>
				<Button
					variant="secondary"
					onClick={() => navigate("/shopping")}
					className="min-h-9 px-3 text-xs"
				>
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
				editPlanWeekStartISO={view === "week" ? weekStartISO : null}
				assignedDays={view === "week" ? readiness.assignedDays : null}
				totalDays={view === "week" ? readiness.totalDays : null}
				canFillEmpty={view === "week" && readiness.canFillEmpty}
				emptyDays={readiness.emptyDays}
				onFillEmpty={handleFillEmpty}
			/>

			{view === "week" ? (
				<>
					<WeekView
						selectedDateISO={selectedDateISO}
						onSelectDate={handleSelectDate}
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
				<p className="text-center text-sm text-ink-muted mt-4 space-x-1">
					<Link to="/meals/new" className="text-brand font-semibold underline">
						<Trans>Crear comida</Trans>
					</Link>
					<span aria-hidden>·</span>
					<Link to={weekPlanPath} className="underline">
						<Trans>Editar plan de esta semana</Trans>
					</Link>
					<span aria-hidden>·</span>
					<Link
						to={weekPlanPath}
						state={{ openImport: true }}
						className="underline"
					>
						<Trans>Importar plan</Trans>
					</Link>
				</p>
			) : readiness.libraryThin && view === "week" ? (
				<p className="text-center text-sm text-ink-muted mt-4 space-x-1">
					<Link to="/meals/new" className="text-brand font-semibold underline">
						<Trans>Nueva comida</Trans>
					</Link>
					<span aria-hidden>·</span>
					<Link
						to={weekPlanPath}
						state={{ openImport: true }}
						className="underline"
					>
						<Trans>Importar</Trans>
					</Link>
				</p>
			) : null}
		</div>
	);
}
