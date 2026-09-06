import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAppState } from "../context/AppState";
import { useToast } from "../components/Toast";
import Button from "../components/ui/Button";
import Sheet from "../components/ui/Sheet";
import MealForm from "../features/meals/MealForm";
import { MEAL_TYPE_MSG } from "../features/meals/mealTypeLabels.js";
import {
	parseDateISO,
	weekDateISOs,
} from "../features/calendar/dateUtils.js";
import { EditDraftMealSheet } from "../features/weekplan/EditScheduledMealSheet";
import ImportJsonSheet from "../features/weekplan/ImportJsonSheet";
import SaveImportedMealsSheet from "../features/weekplan/SaveImportedMealsSheet";
import SortableDayMeals from "../features/weekplan/SortableDayMeals";
import {
	createDraftMeal,
	ingredientsFromRows,
} from "../features/weekplan/weekDraft.js";
import {
	createDayPlan,
	canonicalWeekStartISO,
	dayPlanFromDayTemplate,
	dayPlansFromDietJson,
	getWeekPlan,
	listWeekPlans,
	applyLibrarySaveToDayPlans,
	uniqueDayPlanMealsForSave,
} from "../features/weekplan/weekPlanModel.js";

function loadDayPlansForWeek(state, weekStartISO, dietPlan) {
	if (dietPlan) {
		const slots = dayPlansFromDietJson(dietPlan);
		if (slots.length) return slots;
	}
	const existing = getWeekPlan(state, weekStartISO);
	const existingHasMeals = (existing?.dayPlans || []).some(
		(dp) => (dp.meals || []).length > 0,
	);
	if (existingHasMeals) {
		return existing.dayPlans.map((dp) => createDayPlan(dp));
	}
	const fromTemplates = (state.dayTemplates || [])
		.map((tmpl) => dayPlanFromDayTemplate(state, tmpl.id))
		.filter(Boolean);
	if (fromTemplates.length) return fromTemplates;
	if (existing?.dayPlans?.length) {
		return existing.dayPlans.map((dp) => createDayPlan(dp));
	}
	return [createDayPlan({ name: "Día 1" }), createDayPlan({ name: "Día 2" })];
}

/**
 * Build day-plan slots for a calendar week (no date assignment).
 * Changes autosave; optional gate to copy imported/created meals into the library.
 */
export default function WeekPlanPage() {
	const {
		state,
		saveWeekPlan,
		createMeal,
		updateMeal,
		setCalendarCursorDate,
		setCalendarView,
	} = useAppState();
	const navigate = useNavigate();
	const location = useLocation();
	const [params] = useSearchParams();
	const toast = useToast();
	const { _, i18n } = useLingui();
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const locale = i18n.locale === "en" ? "en-US" : "es-MX";

	const weekStartISO = useMemo(() => {
		const raw = params.get("week");
		const anchor =
			raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)
				? raw
				: state.ui.calendarCursorDate;
		return canonicalWeekStartISO(anchor, weekStartsOn);
	}, [params, state.ui.calendarCursorDate, weekStartsOn]);

	const weekDates = weekDateISOs(weekStartISO, weekStartsOn);
	const dirtyRef = useRef(false);
	const [saveStatus, setSaveStatus] = useState("idle");

	const [dayPlans, setDayPlansState] = useState(() => {
		const loaded = loadDayPlansForWeek(
			state,
			weekStartISO,
			location.state?.dietPlan,
		);
		const existing = getWeekPlan(state, weekStartISO);
		const existingHasMeals = (existing?.dayPlans || []).some(
			(dp) => (dp.meals || []).length > 0,
		);
		const loadedHasMeals = loaded.some((dp) => (dp.meals || []).length > 0);
		dirtyRef.current =
			Boolean(location.state?.dietPlan) ||
			(loadedHasMeals && !existingHasMeals);
		return loaded;
	});

	const setDayPlans = (next) => {
		dirtyRef.current = true;
		setDayPlansState(next);
	};

	const [librarySlotId, setLibrarySlotId] = useState(null);
	const [createSlotId, setCreateSlotId] = useState(null);
	const [editing, setEditing] = useState(null);
	const [expandedMealKey, setExpandedMealKey] = useState(null);
	const [importOpen, setImportOpen] = useState(false);
	const [librarySaveOpen, setLibrarySaveOpen] = useState(false);
	const [copyOpen, setCopyOpen] = useState(false);
	const [libraryQuery, setLibraryQuery] = useState("");

	useEffect(() => {
		if (location.state?.dietPlan) {
			navigate(".", { replace: true, state: {} });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- clear one-shot nav state
	}, []);

	// Reload when the target week changes (e.g. query param).
	const weekStartRef = useRef(weekStartISO);
	useEffect(() => {
		if (weekStartRef.current === weekStartISO) return;
		weekStartRef.current = weekStartISO;
		dirtyRef.current = false;
		setSaveStatus("idle");
		setDayPlansState(loadDayPlansForWeek(state, weekStartISO, null));
		// Intentionally omit `state`: autosave updates state and must not reload the draft.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [weekStartISO]);

	useEffect(() => {
		if (!dirtyRef.current) return;
		setSaveStatus("saving");
		const timer = setTimeout(() => {
			saveWeekPlan(weekStartISO, dayPlans);
			setSaveStatus("saved");
		}, 450);
		return () => clearTimeout(timer);
	}, [dayPlans, weekStartISO, saveWeekPlan]);

	const weekLabel = useMemo(() => {
		const start = parseDateISO(weekDates[0]);
		const end = parseDateISO(weekDates[6]);
		return `${start.toLocaleDateString(locale, { day: "numeric", month: "short" })} – ${end.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}`;
	}, [weekDates, locale]);

	const otherPlans = useMemo(
		() => listWeekPlans(state).filter((p) => p.weekStartISO !== weekStartISO),
		[state, weekStartISO],
	);

	const filteredLibrary = useMemo(() => {
		const q = libraryQuery.trim().toLowerCase();
		return state.mealLibrary.filter((m) =>
			q ? m.name.toLowerCase().includes(q) : true,
		);
	}, [state.mealLibrary, libraryQuery]);

	const syntheticDraft = useMemo(
		() => ({
			weekStartISO,
			days: dayPlans.map((dp) => ({ dateISO: dp.id, meals: dp.meals })),
		}),
		[dayPlans, weekStartISO],
	);

	const needsLibrarySave = uniqueDayPlanMealsForSave(dayPlans).length > 0;

	const updateSlot = (slotId, updater) => {
		setDayPlans((prev) =>
			prev.map((dp) => (dp.id === slotId ? updater(dp) : dp)),
		);
	};

	const handlePickLibrary = (meal) => {
		if (!librarySlotId) return;
		const draftMeal = createDraftMeal({
			mealId: meal.id,
			name: meal.name,
			mealType: meal.mealType,
			ingredients: meal.ingredients || [],
			source: "library",
			dirty: false,
		});
		updateSlot(librarySlotId, (dp) => ({
			...dp,
			meals: [...dp.meals, draftMeal],
		}));
		setLibrarySlotId(null);
		setLibraryQuery("");
	};

	const handleCreateMeal = (payload) => {
		if (!createSlotId) return;
		const draftMeal = createDraftMeal({
			name: payload.name,
			mealType: payload.mealType,
			ingredients: payload.ingredients,
			source: "create",
			mealId: null,
		});
		updateSlot(createSlotId, (dp) => ({
			...dp,
			meals: [...dp.meals, draftMeal],
		}));
		setCreateSlotId(null);
	};

	const handleImportPlan = (plan, mode = "replace") => {
		const slots = dayPlansFromDietJson(plan);
		if (!slots.length) {
			if (mode === "replace") {
				setDayPlans([createDayPlan({ name: "Día 1" })]);
			}
			return;
		}
		if (mode === "append") {
			setDayPlans((prev) => [...prev, ...slots]);
			toast.success(t`Días añadidos al plan.`);
			return;
		}
		setDayPlans(slots);
		toast.success(t`Plan actualizado con el JSON.`);
	};

	const handleCopyFrom = (fromWeekStartISO) => {
		const source = getWeekPlan(state, fromWeekStartISO);
		if (source?.dayPlans?.length) {
			setDayPlans(source.dayPlans.map((dp) => createDayPlan(dp)));
			toast.success(t`Plan copiado.`);
		}
		setCopyOpen(false);
	};

	const handleDraftMealSave = (payload, disposition) => {
		if (!editing) return;
		const ingredients = ingredientsFromRows(payload.ingredients);
		const patch = {
			name: payload.name.trim(),
			mealType: payload.mealType,
			ingredients,
			dirty: true,
		};
		const { slotId, meal } = editing;

		if (disposition === "update" && meal.mealId) {
			updateMeal(meal.mealId, payload);
			updateSlot(slotId, (dp) => ({
				...dp,
				meals: dp.meals.map((m) =>
					m.tempId === meal.tempId
						? {
								...m,
								...patch,
								mealId: meal.mealId,
								dirty: false,
								source: "library",
							}
						: m,
				),
			}));
		} else if (disposition === "duplicate") {
			const newId = createMeal({ ...payload, source: "user" });
			updateSlot(slotId, (dp) => ({
				...dp,
				meals: dp.meals.map((m) =>
					m.tempId === meal.tempId
						? {
								...m,
								...patch,
								mealId: newId,
								dirty: false,
								source: "library",
							}
						: m,
				),
			}));
		} else {
			updateSlot(slotId, (dp) => ({
				...dp,
				meals: dp.meals.map((m) =>
					m.tempId === meal.tempId
						? {
								...m,
								...patch,
								mealId: null,
								source: meal.source === "import" ? "import" : "create",
							}
						: m,
				),
			}));
		}
		setEditing(null);
	};

	const handleLibrarySaveConfirm = ({ selectedTempIds, saveAsTemplate }) => {
		setLibrarySaveOpen(false);
		const opts = {
			selectedSaveTempIds: selectedTempIds,
			saveAsTemplate,
			templateName: t`Plan importado`,
		};
		const { dayPlans: linked } = applyLibrarySaveToDayPlans(
			state,
			dayPlans,
			selectedTempIds,
			{
				saveAsTemplate,
				templateName: opts.templateName,
			},
		);
		saveWeekPlan(weekStartISO, dayPlans, opts);
		dirtyRef.current = false;
		setDayPlansState(linked.map((dp) => createDayPlan(dp)));
		setSaveStatus("saved");
		toast.success(t`Comidas guardadas en la biblioteca.`);
	};

	return (
		<div className="space-y-4 pb-8">
			<div className="flex items-start justify-between gap-3 flex-wrap">
				<div>
					<Link
						to="/"
						className="text-sm font-semibold text-ink-muted hover:text-ink"
					>
						<Trans>← Calendario</Trans>
					</Link>
					<h1 className="font-display text-2xl text-ink mt-1">
						<Trans>Plan de semana</Trans>
					</h1>
					<p className="text-sm text-ink-muted mt-0.5">
						{weekLabel}
						{saveStatus === "saving" ? (
							<span className="ml-2">
								<Trans>Guardando…</Trans>
							</span>
						) : saveStatus === "saved" ? (
							<span className="ml-2">
								<Trans>Guardado</Trans>
							</span>
						) : null}
					</p>
				</div>
				<div className="flex gap-2 flex-wrap">
					<Button
						onClick={() => {
							setCalendarCursorDate(weekStartISO);
							setCalendarView("week");
							navigate("/");
						}}
					>
						<Trans>Ir a Semana</Trans>
					</Button>
					<Button variant="secondary" onClick={() => setImportOpen(true)}>
						<Trans>Importar JSON</Trans>
					</Button>
					<Button variant="ghost" onClick={() => setCopyOpen(true)}>
						<Trans>Usar otra semana</Trans>
					</Button>
				</div>
			</div>

			<p className="text-sm text-ink-muted">
				<Trans>
					Arma los planes de día (comidas por slot). Arrastra para reordenar.
					Los cambios se guardan solos. Luego, en Semana, asigna cada plan a un
					día.
				</Trans>
			</p>

			{needsLibrarySave ? (
				<div className="rounded-app border border-border bg-surface-2/50 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
					<p className="text-sm text-ink-muted">
						<Trans>
							Hay comidas nuevas o importadas que aún no están en la biblioteca.
						</Trans>
					</p>
					<Button
						variant="secondary"
						className="!min-h-9"
						onClick={() => setLibrarySaveOpen(true)}
					>
						<Trans>Guardar en biblioteca</Trans>
					</Button>
				</div>
			) : null}

			<ul className="space-y-4">
				{dayPlans.map((slot) => (
					<li
						key={slot.id}
						className="border border-border rounded-app bg-surface p-4"
					>
						<div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
							<input
								value={slot.name}
								onChange={(e) =>
									updateSlot(slot.id, (dp) => ({
										...dp,
										name: e.target.value,
									}))
								}
								className="font-display text-lg text-ink bg-transparent border-b border-transparent focus:border-border outline-none min-w-[8rem]"
								aria-label={t`Nombre del plan de día`}
							/>
							{dayPlans.length > 1 ? (
								<Button
									variant="ghost"
									className="!min-h-9 !px-2 text-xs text-[var(--color-danger)]"
									onClick={() =>
										setDayPlans((prev) =>
											prev.filter((dp) => dp.id !== slot.id),
										)
									}
								>
									<Trans>Quitar día</Trans>
								</Button>
							) : null}
						</div>

						{slot.meals.length === 0 ? (
							<p className="text-sm text-ink-muted">
								<Trans>Sin comidas en este plan de día.</Trans>
							</p>
						) : (
							<SortableDayMeals
								slotId={slot.id}
								meals={slot.meals}
								expandedMealKey={expandedMealKey}
								onExpandedMealKeyChange={setExpandedMealKey}
								onEdit={(meal) => setEditing({ slotId: slot.id, meal })}
								onRemove={(tempId) =>
									updateSlot(slot.id, (dp) => ({
										...dp,
										meals: dp.meals.filter((m) => m.tempId !== tempId),
									}))
								}
								onReorder={(meals) =>
									updateSlot(slot.id, (dp) => ({ ...dp, meals }))
								}
							/>
						)}

						<div className="flex gap-2 mt-3">
							<Button
								variant="secondary"
								className="flex-1"
								onClick={() => setLibrarySlotId(slot.id)}
							>
								<Trans>Agregar de la biblioteca</Trans>
							</Button>
							<Button
								variant="secondary"
								className="flex-1"
								onClick={() => setCreateSlotId(slot.id)}
							>
								<Trans>Crear comida nueva</Trans>
							</Button>
						</div>
					</li>
				))}
			</ul>

			<div className="flex gap-2 flex-wrap">
				<Button
					variant="secondary"
					onClick={() =>
						setDayPlans((prev) => [
							...prev,
							createDayPlan({ name: `Día ${prev.length + 1}` }),
						])
					}
				>
					<Trans>Añadir plan de día</Trans>
				</Button>
			</div>

			<Sheet
				open={Boolean(librarySlotId)}
				onClose={() => {
					setLibrarySlotId(null);
					setLibraryQuery("");
				}}
				title={<Trans>De la biblioteca</Trans>}
			>
				<input
					value={libraryQuery}
					onChange={(e) => setLibraryQuery(e.target.value)}
					placeholder={t`Buscar comida…`}
					className="w-full min-h-11 px-3 rounded-app border border-border bg-surface mb-3"
				/>
				{filteredLibrary.length === 0 ? (
					<p className="text-sm text-ink-muted">
						<Trans>No hay comidas en la biblioteca.</Trans>
					</p>
				) : (
					<ul className="space-y-2 max-h-72 overflow-y-auto">
						{filteredLibrary.map((meal) => (
							<li key={meal.id}>
								<button
									type="button"
									onClick={() => handlePickLibrary(meal)}
									className="w-full text-left border border-border rounded-app px-3 py-3 hover:bg-surface-2"
								>
									<span className="font-semibold text-ink block">
										{meal.name}
									</span>
									<span className="text-xs text-ink-muted">
										{_(MEAL_TYPE_MSG[meal.mealType] || MEAL_TYPE_MSG.otro)}
									</span>
								</button>
							</li>
						))}
					</ul>
				)}
			</Sheet>

			<Sheet
				open={Boolean(createSlotId)}
				onClose={() => setCreateSlotId(null)}
				title={<Trans>Crear comida</Trans>}
			>
				<MealForm
					key={createSlotId || "create"}
					submitLabel={<Trans>Añadir al plan</Trans>}
					onSubmit={handleCreateMeal}
					onCancel={() => setCreateSlotId(null)}
				/>
			</Sheet>

			<Sheet
				open={copyOpen}
				onClose={() => setCopyOpen(false)}
				title={<Trans>Usar plan de otra semana</Trans>}
			>
				{otherPlans.length === 0 ? (
					<p className="text-sm text-ink-muted">
						<Trans>No hay otros planes de semana guardados.</Trans>
					</p>
				) : (
					<ul className="space-y-2">
						{otherPlans.map((plan) => {
							const start = parseDateISO(plan.weekStartISO);
							const label = start.toLocaleDateString(locale, {
								day: "numeric",
								month: "short",
								year: "numeric",
							});
							return (
								<li key={plan.weekStartISO}>
									<button
										type="button"
										onClick={() => handleCopyFrom(plan.weekStartISO)}
										className="w-full text-left border border-border rounded-app px-3 py-3 hover:bg-surface-2"
									>
										<span className="font-semibold block">
											<Trans>Semana del</Trans> {label}
										</span>
										<span className="text-xs text-ink-muted">
											{plan.dayPlans.length} <Trans>planes de día</Trans>
										</span>
									</button>
								</li>
							);
						})}
					</ul>
				)}
			</Sheet>

			<ImportJsonSheet
				open={importOpen}
				onClose={() => setImportOpen(false)}
				onImport={handleImportPlan}
				hasExistingDayPlans={dayPlans.length > 0}
			/>

			<SaveImportedMealsSheet
				open={librarySaveOpen}
				onClose={() => setLibrarySaveOpen(false)}
				draft={syntheticDraft}
				onConfirm={handleLibrarySaveConfirm}
			/>

			<EditDraftMealSheet
				open={Boolean(editing)}
				onClose={() => setEditing(null)}
				meal={editing?.meal}
				onSave={handleDraftMealSave}
			/>
		</div>
	);
}
