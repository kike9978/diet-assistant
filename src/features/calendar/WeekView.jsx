import {
	DndContext,
	DragOverlay,
	PointerSensor,
	closestCenter,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useState } from "react";
import { useAppState } from "../../context/AppState";
import { DAY_SHORT_MSG } from "../../i18n/weekDayLabels";
import { MEAL_TYPE_COLOR } from "./mealTypeColors.js";
import { parseDateISO, todayISO, weekDateISOs } from "./dateUtils.js";

function MealChip({ meal, isDragging }) {
	return (
		<div
			className={`text-xs font-semibold px-2 py-1 rounded-md text-white truncate touch-none ${
				isDragging ? "opacity-90 shadow-soft ring-2 ring-white" : ""
			}`}
			style={{
				backgroundColor: MEAL_TYPE_COLOR[meal.mealType] || MEAL_TYPE_COLOR.otro,
			}}
			title={meal.name}
		>
			{meal.name}
		</div>
	);
}

function DraggableMeal({ meal, onOpen }) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: meal.instanceId,
			data: { meal },
		});

	const style = {
		transform: CSS.Translate.toString(transform),
		opacity: isDragging ? 0.35 : 1,
	};

	return (
		<div ref={setNodeRef} style={style} className="relative">
			<button
				type="button"
				className="w-full text-left"
				onClick={(e) => {
					e.stopPropagation();
					onOpen?.(meal);
				}}
				{...listeners}
				{...attributes}
			>
				<MealChip meal={meal} />
			</button>
		</div>
	);
}

function DroppableDay({ dateISO, selected, isToday, children, onSelect }) {
	const { setNodeRef, isOver } = useDroppable({ id: dateISO });
	const { _ } = useLingui();
	const d = parseDateISO(dateISO);
	const dayKey = [
		"sunday",
		"monday",
		"tuesday",
		"wednesday",
		"thursday",
		"friday",
		"saturday",
	][d.getDay()];

	return (
		<div
			ref={setNodeRef}
			role="button"
			tabIndex={0}
			aria-pressed={selected}
			onClick={() => onSelect(dateISO)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelect(dateISO);
				}
			}}
			className={`snap-start shrink-0 w-[7.5rem] sm:w-auto text-left bg-surface border rounded-app p-3 min-h-28 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand)] ${
				selected
					? "border-[var(--color-brand)] ring-1 ring-inset ring-[var(--color-brand)]"
					: "border-border hover:border-ink-muted"
			} ${isOver ? "bg-surface-2 border-[var(--color-accent-leaf)]" : ""}`}
		>
			<p className="text-xs font-semibold text-ink-muted mb-2 flex items-baseline gap-1">
				<span>{_(DAY_SHORT_MSG[dayKey])}</span>
				<span className={isToday ? "text-brand" : "text-ink"}>
					{d.getDate()}
				</span>
				{isToday ? (
					<span className="sr-only">
						<Trans>Hoy</Trans>
					</span>
				) : null}
			</p>
			<div className="space-y-1">{children}</div>
		</div>
	);
}

/**
 * Week planning grid with drag-and-drop between days.
 */
export default function WeekView({
	selectedDateISO,
	onSelectDate,
	onOpenMeal,
}) {
	const { state, moveMealInstance } = useAppState();
	const memberId = state.household.activeMemberId;
	const cal = state.calendars[memberId] || {};
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const dates = weekDateISOs(state.ui.calendarCursorDate, weekStartsOn);
	const today = todayISO();
	const [activeMeal, setActiveMeal] = useState(null);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
	);

	const handleDragEnd = (event) => {
		const { active, over } = event;
		setActiveMeal(null);
		if (!over) return;
		const instanceId = String(active.id);
		const toDateISO = String(over.id);
		if (!dates.includes(toDateISO)) return;
		const fromDate = dates.find((d) =>
			(cal[d] || []).some((m) => m.instanceId === instanceId),
		);
		if (!fromDate || fromDate === toDateISO) return;
		moveMealInstance(instanceId, toDateISO);
	};

	return (
		<section className="mb-4" aria-label="Semana">
			<p className="text-xs text-ink-muted mb-2 sm:hidden">
				<Trans>Arrastra comidas entre días</Trans>
			</p>
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragStart={(e) => setActiveMeal(e.active.data.current?.meal || null)}
				onDragEnd={handleDragEnd}
				onDragCancel={() => setActiveMeal(null)}
			>
				<div className="flex sm:grid sm:grid-cols-7 gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
					{dates.map((dateISO) => {
						const meals = cal[dateISO] || [];
						return (
							<DroppableDay
								key={dateISO}
								dateISO={dateISO}
								selected={dateISO === selectedDateISO}
								isToday={dateISO === today}
								onSelect={onSelectDate}
							>
								{meals.map((meal) => (
									<DraggableMeal
										key={meal.instanceId}
										meal={meal}
										onOpen={onOpenMeal}
									/>
								))}
								{meals.length === 0 ? (
									<p className="text-xs text-ink-muted mt-1">
										<Trans>Vacío</Trans>
									</p>
								) : null}
							</DroppableDay>
						);
					})}
				</div>
				<DragOverlay>
					{activeMeal ? <MealChip meal={activeMeal} isDragging /> : null}
				</DragOverlay>
			</DndContext>
		</section>
	);
}
