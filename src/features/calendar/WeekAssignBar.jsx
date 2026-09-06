import { Trans } from "@lingui/react/macro";
import { Link } from "react-router-dom";

/**
 * Link to edit the week plan for the visible week.
 */
export default function WeekAssignBar({ weekStartISO }) {
	return (
		<div className="mb-3 flex items-center justify-end gap-2 flex-wrap">
			<Link
				to={`/plan/week?week=${encodeURIComponent(weekStartISO)}`}
				className="inline-flex items-center justify-center min-h-9 px-3 rounded-app text-xs font-semibold border border-border bg-surface hover:bg-surface-2"
			>
				<Trans>Editar plan</Trans>
			</Link>
		</div>
	);
}
