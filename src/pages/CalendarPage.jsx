import { useEffect, useState } from "react";
import { Trans } from "@lingui/react/macro";
import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import DayDetail from "../features/calendar/DayDetail";
import WeekSurface from "../features/calendar/WeekSurface";
import {
	todayISO,
	weekDateISOs,
} from "../features/calendar/dateUtils.js";
import FirstRun from "../components/FirstRun";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";

function defaultSelectedDate(cursorDate, weekStartsOn) {
	const today = todayISO();
	const week = weekDateISOs(cursorDate, weekStartsOn);
	if (week.includes(today)) return today;
	return week[0];
}

export default function CalendarPage() {
	const { hasContent, state, setCalendarCursorDate } = useAppState();
	const navigate = useNavigate();
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const cursor = state.ui.calendarCursorDate;
	const showOnboarding = !state.ui.onboardingDismissed && !hasContent;

	const [selectedDateISO, setSelectedDateISO] = useState(() =>
		defaultSelectedDate(cursor, weekStartsOn),
	);

	// Keep selection inside the visible week when cursor / weekStartsOn changes
	useEffect(() => {
		const week = weekDateISOs(cursor, weekStartsOn);
		if (!week.includes(selectedDateISO)) {
			setSelectedDateISO(defaultSelectedDate(cursor, weekStartsOn));
		}
	}, [cursor, weekStartsOn, selectedDateISO]);

	const handleSelectDate = (dateISO) => {
		setSelectedDateISO(dateISO);
		setCalendarCursorDate(dateISO);
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
				<div className="flex gap-2">
					<Button variant="secondary" onClick={() => navigate("/meals/new")}>
						<Trans>Crear comida</Trans>
					</Button>
					<Button onClick={() => navigate("/shopping")}>
						<Trans>Ir a compras</Trans>
					</Button>
				</div>
			</div>

			<WeekSurface
				selectedDateISO={selectedDateISO}
				onSelectDate={handleSelectDate}
			/>
			<DayDetail dateISO={selectedDateISO} />
		</div>
	);
}
