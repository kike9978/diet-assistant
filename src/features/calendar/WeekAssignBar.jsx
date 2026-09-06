import { Trans } from "@lingui/react/macro";
import { Link } from "react-router-dom";
import { useAppState } from "../../context/AppState";
import {
	getWeekPlan,
	weekPlanHasContent,
} from "../weekplan/weekPlanModel.js";

/**
 * Compact Semana hint + link to edit the week plan.
 * Assign day plans to the selected day in DayView below.
 */
export default function WeekAssignBar({ weekStartISO }) {
	const { state } = useAppState();
	const plan = getWeekPlan(state, weekStartISO);
	const hasMeals = weekPlanHasContent(plan);
	const hasSlots = Boolean(plan?.dayPlans?.length);

	return (
		<div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
			<p className="text-sm text-ink-muted">
				{hasMeals ? (
					<Trans>
						Elige un día abajo y usa un plan de día con Usar.
					</Trans>
				) : hasSlots ? (
					<Trans>
						El plan de semana aún no tiene comidas. Edítalo para armar los
						planes de día.
					</Trans>
				) : (
					<Trans>
						Arma el plan de semana, luego asigna cada plan de día abajo.
					</Trans>
				)}
			</p>
			<Link
				to={`/plan/week?week=${encodeURIComponent(weekStartISO)}`}
				className="inline-flex items-center justify-center min-h-9 px-3 rounded-app text-xs font-semibold border border-border bg-surface hover:bg-surface-2"
			>
				<Trans>Editar plan</Trans>
			</Link>
		</div>
	);
}
