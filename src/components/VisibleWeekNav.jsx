import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppState } from "../context/AppState";
import {
	addDays,
	parseDateISO,
	todayISO,
	weekDateISOs,
} from "../features/calendar/dateUtils.js";
import Button from "./ui/Button";

/**
 * Prev / week range / next (+ Hoy when not on the current week).
 * Shares calendarCursorDate with calendar, shopping, and prep.
 */
export default function VisibleWeekNav({ className = "" }) {
	const { state, visibleWeekDates, setCalendarCursorDate } = useAppState();
	const { i18n } = useLingui();
	const locale = i18n.locale === "en" ? "en-US" : "es-MX";
	const weekStartsOn = state.settings.weekStartsOn ?? 1;

	const weekLabel =
		visibleWeekDates?.length >= 7
			? `${parseDateISO(visibleWeekDates[0]).toLocaleDateString(locale, { day: "numeric", month: "short" })} – ${parseDateISO(visibleWeekDates[6]).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}`
			: "";

	const isCurrentWeek = useMemo(() => {
		const todayWeek = weekDateISOs(todayISO(), weekStartsOn);
		return todayWeek[0] === visibleWeekDates?.[0];
	}, [visibleWeekDates, weekStartsOn]);

	const shiftWeek = (delta) => {
		const cursor = state.ui.calendarCursorDate || todayISO();
		setCalendarCursorDate(addDays(cursor, delta * 7));
	};

	const goToCurrentWeek = () => setCalendarCursorDate(todayISO());

	return (
		<div className={`flex items-center gap-1 shrink-0 ${className}`.trim()}>
			<Button
				variant="secondary"
				className="!px-2.5 shrink-0"
				aria-label={t`Semana anterior`}
				onClick={() => shiftWeek(-1)}
			>
				<ChevronLeft className="size-4" aria-hidden />
			</Button>
			<span className="text-sm font-semibold text-ink tabular-nums px-1 whitespace-nowrap">
				{weekLabel || <Trans>Semana</Trans>}
			</span>
			<Button
				variant="secondary"
				className="!px-2.5 shrink-0"
				aria-label={t`Semana siguiente`}
				onClick={() => shiftWeek(1)}
			>
				<ChevronRight className="size-4" aria-hidden />
			</Button>
			{!isCurrentWeek ? (
				<Button
					variant="secondary"
					className="!px-3 shrink-0"
					onClick={goToCurrentWeek}
				>
					<Trans>Hoy</Trans>
				</Button>
			) : null}
		</div>
	);
}
