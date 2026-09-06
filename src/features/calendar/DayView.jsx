import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAppState } from "../../context/AppState";
import { DAY_LABEL_MSG } from "../../i18n/weekDayLabels";
import Button from "../../components/ui/Button";
import { MEAL_TYPE_MSG } from "../meals/mealTypeLabels.js";
import { quantityLabel } from "./calendarActions.js";
import { parseDateISO } from "./dateUtils.js";
import { MEAL_TYPE_COLOR } from "./mealTypeColors.js";
import ScheduleMealSheet from "./ScheduleMealSheet";
import SubstituteSheet from "./SubstituteSheet";

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
 * Day agenda: add/replace/substitute, clear day, usar plantilla de día.
 */
export default function DayView({ dateISO }) {
	const {
		state,
		assignDayTemplate,
		clearCalendarDay,
		removeMealInstance,
	} = useAppState();
	const { _, i18n } = useLingui();
	const memberId = state.household.activeMemberId;
	const meals = state.calendars[memberId]?.[dateISO] || [];
	const dayTemplates = state.dayTemplates;
	const d = parseDateISO(dateISO);
	const weekdayKey = DAY_KEYS[d.getDay()];
	const dateLabel = d.toLocaleDateString(
		i18n.locale === "en" ? "en-US" : "es-MX",
		{ day: "numeric", month: "long" },
	);

	const [scheduleOpen, setScheduleOpen] = useState(false);
	const [replaceInstanceId, setReplaceInstanceId] = useState(null);
	const [subTarget, setSubTarget] = useState(null);
	const [expandedTemplateId, setExpandedTemplateId] = useState(null);

	const mealById = Object.fromEntries(
		state.mealLibrary.map((m) => [m.id, m]),
	);

	const openSchedule = (instanceId = null) => {
		setReplaceInstanceId(instanceId);
		setScheduleOpen(true);
	};

	return (
		<section
			className="bg-surface border border-border rounded-app p-4 sm:p-5"
			aria-labelledby="day-view-heading"
		>
			<div className="flex items-start justify-between gap-3 flex-wrap mb-4">
				<div>
					<h2
						id="day-view-heading"
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
								Sin comidas. Aplica una plantilla o agrega de la biblioteca.
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
					<Button variant="secondary" onClick={() => openSchedule(null)}>
						<Trans>De biblioteca</Trans>
					</Button>
					<Link
						to={`/meals/new?date=${encodeURIComponent(dateISO)}`}
						className="inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 rounded-app text-sm font-semibold transition bg-brand text-white hover:bg-[var(--color-brand-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2"
					>
						<Trans>Crear</Trans>
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
							<div className="flex items-start justify-between gap-2 mb-2">
								<div className="flex items-center gap-2 min-w-0">
									<span
										className="w-2.5 h-2.5 rounded-full shrink-0"
										style={{
											backgroundColor:
												MEAL_TYPE_COLOR[meal.mealType] || MEAL_TYPE_COLOR.otro,
										}}
										aria-hidden
									/>
									<div className="min-w-0">
										<h3 className="font-semibold text-ink truncate">
											{meal.name}
										</h3>
										<p className="text-xs text-ink-muted">
											{_(
												MEAL_TYPE_MSG[meal.mealType] || MEAL_TYPE_MSG.otro,
											)}
										</p>
									</div>
								</div>
								<div className="flex gap-1 shrink-0">
									<Button
										variant="ghost"
										className="!min-h-9 !px-2 text-xs"
										onClick={() => openSchedule(meal.instanceId)}
									>
										<Trans>Reemplazar</Trans>
									</Button>
									<Button
										variant="ghost"
										className="!min-h-9 !px-2 text-xs text-[var(--color-danger)]"
										onClick={() => removeMealInstance(meal.instanceId)}
									>
										<Trans>Quitar</Trans>
									</Button>
								</div>
							</div>
							<ul className="text-sm text-ink-muted space-y-1">
								{(meal.ingredients || []).map((ing) => (
									<li
										key={
											ing.id || `${ing.name}-${quantityLabel(ing.quantity)}`
										}
										className="flex items-center justify-between gap-2"
									>
										<span>
											{ing.name}
											{quantityLabel(ing.quantity)
												? ` (${quantityLabel(ing.quantity)})`
												: ""}
										</span>
										<button
											type="button"
											className="text-xs font-semibold text-brand shrink-0"
											onClick={() =>
												setSubTarget({
													instanceId: meal.instanceId,
													ingredient: ing,
													mealName: meal.name,
												})
											}
										>
											<Trans>Sustituir</Trans>
										</button>
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
							const templateMeals = (template.mealIds || [])
								.map((id) => mealById[id])
								.filter(Boolean);
							const mealCount = templateMeals.length;
							const isExpanded = expandedTemplateId === template.id;

							return (
								<li
									key={template.id}
									className="border border-border rounded-app overflow-hidden"
								>
									<div className="flex items-center gap-2 px-3 py-2">
										<button
											type="button"
											className="flex-1 min-w-0 text-left flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] rounded-md"
											aria-expanded={isExpanded}
											onClick={() =>
												setExpandedTemplateId(
													isExpanded ? null : template.id,
												)
											}
										>
											<svg
												className={`w-4 h-4 shrink-0 text-ink-muted transition-transform ${
													isExpanded ? "rotate-180" : ""
												}`}
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												aria-hidden
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M19 9l-7 7-7-7"
												/>
											</svg>
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
										</button>
										<Button
											variant="secondary"
											className="shrink-0"
											onClick={() =>
												assignDayTemplate(template.id, dateISO)
											}
										>
											<Trans>Usar</Trans>
										</Button>
									</div>

									{isExpanded ? (
										<ul className="border-t border-border bg-surface-2/40 px-3 py-3 space-y-3">
											{templateMeals.length === 0 ? (
												<li className="text-sm text-ink-muted">
													<Trans>Esta plantilla no tiene comidas.</Trans>
												</li>
											) : (
												templateMeals.map((meal) => (
													<li key={meal.id}>
														<div className="flex items-center gap-2 mb-1">
															<span
																className="w-2 h-2 rounded-full shrink-0"
																style={{
																	backgroundColor:
																		MEAL_TYPE_COLOR[meal.mealType] ||
																		MEAL_TYPE_COLOR.otro,
																}}
																aria-hidden
															/>
															<p className="font-semibold text-sm text-ink">
																{meal.name}
															</p>
															<span className="text-xs text-ink-muted">
																{_(
																	MEAL_TYPE_MSG[meal.mealType] ||
																		MEAL_TYPE_MSG.otro,
																)}
															</span>
														</div>
														<ul className="text-xs text-ink-muted pl-4 list-disc space-y-0.5">
															{(meal.ingredients || []).map((ing) => (
																<li
																	key={
																		ing.id ||
																		`${ing.name}-${quantityLabel(ing.quantity)}`
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
												))
											)}
										</ul>
									) : null}
								</li>
							);
						})}
					</ul>
				)}
			</div>

			<ScheduleMealSheet
				open={scheduleOpen}
				onClose={() => {
					setScheduleOpen(false);
					setReplaceInstanceId(null);
				}}
				dateISO={dateISO}
				replaceInstanceId={replaceInstanceId}
			/>

			<SubstituteSheet
				open={Boolean(subTarget)}
				onClose={() => setSubTarget(null)}
				instanceId={subTarget?.instanceId}
				ingredient={subTarget?.ingredient}
				mealName={subTarget?.mealName}
			/>
		</section>
	);
}
