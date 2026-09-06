import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { Link } from "react-router-dom";
import { useAppState } from "../../context/AppState";
import { DAY_LABEL_MSG } from "../../i18n/weekDayLabels";
import Button from "../../components/ui/Button";
import { quantityLabel } from "./calendarActions.js";
import { parseDateISO } from "./dateUtils.js";

const TYPE_COLOR = {
	desayuno: "var(--color-accent-breakfast)",
	colacion: "var(--color-accent-snack)",
	comida: "var(--color-accent-lunch)",
	merienda: "var(--color-accent-snack)",
	cena: "var(--color-accent-dinner)",
	otro: "var(--color-ink-muted)",
};

const DAY_KEYS = [
	"sunday",
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
];

/**
 * Day detail for the selected calendar date — meals + apply day template.
 * @param {{ dateISO: string }} props
 */
export default function DayDetail({ dateISO }) {
	const { state, assignDayTemplate, clearCalendarDay } = useAppState();
	const { _, i18n } = useLingui();
	const memberId = state.household.activeMemberId;
	const meals = state.calendars[memberId]?.[dateISO] || [];
	const dayTemplates = state.dayTemplates;
	const d = parseDateISO(dateISO);
	const weekdayKey = DAY_KEYS[d.getDay()];
	const dateLabel = d.toLocaleDateString(i18n.locale === "en" ? "en-US" : "es-MX", {
		day: "numeric",
		month: "long",
	});

	return (
		<section
			className="bg-surface border border-border rounded-app p-4 sm:p-5"
			aria-labelledby="day-detail-heading"
		>
			<div className="flex items-start justify-between gap-3 flex-wrap mb-4">
				<div>
					<h2
						id="day-detail-heading"
						className="font-display text-xl text-ink"
					>
						{_(DAY_LABEL_MSG[weekdayKey])}{" "}
						<span className="text-ink-muted font-normal text-base">
							{dateLabel}
						</span>
					</h2>
					<p className="text-sm text-ink-muted mt-1">
						{meals.length === 0 ? (
							<Trans>
								Sin comidas. Aplica una plantilla o crea una comida.
							</Trans>
						) : meals.length === 1 ? (
							<Trans>1 comida</Trans>
						) : (
							<Trans>{meals.length} comidas</Trans>
						)}
					</p>
				</div>
				<div className="flex gap-2 flex-wrap">
					{meals.length > 0 ? (
						<Button
							variant="danger"
							onClick={() => clearCalendarDay(dateISO)}
						>
							<Trans>Limpiar día</Trans>
						</Button>
					) : null}
					<Link
						to={`/meals/new?date=${encodeURIComponent(dateISO)}`}
						className="inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 rounded-app text-sm font-semibold transition bg-surface text-ink border border-border hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2"
					>
						<Trans>Crear comida</Trans>
					</Link>
				</div>
			</div>

			{meals.length > 0 ? (
				<ul className="space-y-3 mb-6">
					{meals.map((meal) => (
						<li
							key={meal.instanceId}
							className="border border-border rounded-app p-3"
						>
							<div className="flex items-center gap-2 mb-2">
								<span
									className="w-2.5 h-2.5 rounded-full shrink-0"
									style={{
										backgroundColor:
											TYPE_COLOR[meal.mealType] || TYPE_COLOR.otro,
									}}
									aria-hidden
								/>
								<h3 className="font-semibold text-ink">{meal.name}</h3>
							</div>
							<ul className="text-sm text-ink-muted space-y-0.5 pl-4 list-disc">
								{(meal.ingredients || []).map((ing) => (
									<li
										key={
											ing.id || `${ing.name}-${quantityLabel(ing.quantity)}`
										}
									>
										{ing.name}
										{quantityLabel(ing.quantity)
											? ` (${quantityLabel(ing.quantity)})`
											: ""}
									</li>
								))}
							</ul>
						</li>
					))}
				</ul>
			) : null}

			<div>
				<h3 className="text-sm font-semibold text-ink mb-2">
					<Trans>Usar plantilla de día</Trans>
				</h3>
				{dayTemplates.length === 0 ? (
					<p className="text-sm text-ink-muted">
						<Trans>
							No hay plantillas.{" "}
							<Link to="/plans" className="text-brand underline font-semibold">
								Importa un plan
							</Link>{" "}
							o crea comidas sueltas.
						</Trans>
					</p>
				) : (
					<ul className="space-y-2">
						{dayTemplates.map((template) => {
							const mealCount = template.mealIds?.length || 0;
							return (
								<li
									key={template.id}
									className="flex items-center justify-between gap-3 border border-border rounded-app px-3 py-2"
								>
									<div className="min-w-0">
										<p className="font-semibold text-ink truncate">
											{template.name}
										</p>
										<p className="text-xs text-ink-muted">
											{mealCount === 1 ? (
												<Trans>1 comida</Trans>
											) : (
												<Trans>{mealCount} comidas</Trans>
											)}
										</p>
									</div>
									<Button
										variant="secondary"
										className="shrink-0"
										onClick={() =>
											assignDayTemplate(template.id, dateISO)
										}
									>
										<Trans>Usar</Trans>
									</Button>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</section>
	);
}
