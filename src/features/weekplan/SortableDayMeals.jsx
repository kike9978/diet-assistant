import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useEffect, useId, useRef, useState } from "react";
import Button from "../../components/ui/Button";
import { MEAL_TYPE_MSG } from "../meals/mealTypeLabels.js";
import { quantityLabel } from "../calendar/calendarActions.js";

function DragHandle({ attributes, listeners }) {
	return (
		<button
			type="button"
			className="shrink-0 mt-0.5 p-1 -ml-1 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 touch-none cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand)]"
			aria-label={t`Reordenar comida`}
			{...attributes}
			{...listeners}
		>
			<svg
				className="w-4 h-4"
				viewBox="0 0 24 24"
				fill="currentColor"
				aria-hidden
			>
				<circle cx="9" cy="6" r="1.5" />
				<circle cx="15" cy="6" r="1.5" />
				<circle cx="9" cy="12" r="1.5" />
				<circle cx="15" cy="12" r="1.5" />
				<circle cx="9" cy="18" r="1.5" />
				<circle cx="15" cy="18" r="1.5" />
			</svg>
		</button>
	);
}

function MealRowActions({ meal, onEdit, onRemove }) {
	const [open, setOpen] = useState(false);
	const menuRef = useRef(null);
	const menuId = useId();

	useEffect(() => {
		if (!open) return;
		const onPointerDown = (event) => {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
				setOpen(false);
			}
		};
		const onKeyDown = (event) => {
			if (event.key === "Escape") setOpen(false);
		};
		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open]);

	return (
		<>
			<div className="hidden sm:flex gap-1 shrink-0">
				<Button
					variant="ghost"
					className="!min-h-9 !px-2 text-xs"
					onClick={() => onEdit(meal)}
				>
					<Trans>Editar</Trans>
				</Button>
				<Button
					variant="ghost"
					className="!min-h-9 !px-2 text-xs text-[var(--color-danger)]"
					onClick={() => onRemove(meal.tempId)}
				>
					<Trans>Quitar</Trans>
				</Button>
			</div>

			<div className="relative sm:hidden shrink-0" ref={menuRef}>
				<button
					type="button"
					className="inline-flex items-center justify-center min-h-9 min-w-9 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand)]"
					aria-label={t`Más opciones`}
					aria-haspopup="menu"
					aria-expanded={open}
					aria-controls={open ? menuId : undefined}
					onClick={() => setOpen((value) => !value)}
				>
					<svg
						className="w-5 h-5"
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-hidden
					>
						<circle cx="12" cy="5" r="1.75" />
						<circle cx="12" cy="12" r="1.75" />
						<circle cx="12" cy="19" r="1.75" />
					</svg>
				</button>
				{open ? (
					<div
						id={menuId}
						role="menu"
						className="absolute right-0 top-full mt-1 z-30 min-w-36 rounded-app border border-border bg-surface shadow-soft py-1"
					>
						<button
							type="button"
							role="menuitem"
							className="w-full text-left px-3 py-2.5 text-sm font-semibold text-ink hover:bg-surface-2 focus:outline-none focus-visible:bg-surface-2"
							onClick={() => {
								setOpen(false);
								onEdit(meal);
							}}
						>
							<Trans>Editar</Trans>
						</button>
						<button
							type="button"
							role="menuitem"
							className="w-full text-left px-3 py-2.5 text-sm font-semibold text-[var(--color-danger)] hover:bg-surface-2 focus:outline-none focus-visible:bg-surface-2"
							onClick={() => {
								setOpen(false);
								onRemove(meal.tempId);
							}}
						>
							<Trans>Quitar</Trans>
						</button>
					</div>
				) : null}
			</div>
		</>
	);
}

function SortableMealRow({
	meal,
	isExpanded,
	onToggleExpand,
	onEdit,
	onRemove,
}) {
	const { _ } = useLingui();
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: meal.tempId });

	const ingredients = meal.ingredients || [];
	const ingredientCount = ingredients.length;

	return (
		<li
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
			}}
			className={`border border-border rounded-app bg-surface ${
				isDragging
					? "opacity-60 shadow-soft z-10 relative overflow-hidden"
					: "overflow-visible"
			}`}
		>
			<div className="flex items-start justify-between gap-2 px-3 py-2">
				<div className="min-w-0 flex-1 flex items-start gap-1">
					<DragHandle attributes={attributes} listeners={listeners} />
					<button
						type="button"
						className="min-w-0 flex-1 flex items-start gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand)] rounded-md"
						aria-expanded={isExpanded}
						onClick={onToggleExpand}
					>
						<svg
							className={`w-4 h-4 shrink-0 text-ink-muted mt-1 transition-transform ${
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
							<p className="font-semibold text-ink line-clamp-2">{meal.name}</p>
							<p className="text-xs text-ink-muted">
								{_(MEAL_TYPE_MSG[meal.mealType] || MEAL_TYPE_MSG.otro)}
								{ingredientCount > 0 ? (
									<>
										{" · "}
										{ingredientCount} <Trans>ingredientes</Trans>
									</>
								) : null}
							</p>
						</div>
					</button>
				</div>
				<MealRowActions meal={meal} onEdit={onEdit} onRemove={onRemove} />
			</div>

			{isExpanded ? (
				<ul className="border-t border-border bg-surface-2/40 px-3 py-3 text-sm text-ink-muted space-y-1 rounded-b-app">
					{ingredientCount === 0 ? (
						<li>
							<Trans>Sin ingredientes</Trans>
						</li>
					) : (
						ingredients.map((ing) => (
							<li
								key={ing.id || `${ing.name}-${quantityLabel(ing.quantity)}`}
							>
								{ing.name}
								{quantityLabel(ing.quantity)
									? ` (${quantityLabel(ing.quantity)})`
									: ""}
							</li>
						))
					)}
				</ul>
			) : null}
		</li>
	);
}

/**
 * Sortable meal list for one day-plan slot.
 */
export default function SortableDayMeals({
	slotId,
	meals,
	expandedMealKey,
	onExpandedMealKeyChange,
	onEdit,
	onRemove,
	onReorder,
}) {
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = (event) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = meals.findIndex((m) => m.tempId === active.id);
		const newIndex = meals.findIndex((m) => m.tempId === over.id);
		if (oldIndex < 0 || newIndex < 0) return;
		onReorder(arrayMove(meals, oldIndex, newIndex));
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={meals.map((m) => m.tempId)}
				strategy={verticalListSortingStrategy}
			>
				<ul className="space-y-2">
					{meals.map((meal) => {
						const mealKey = `${slotId}:${meal.tempId}`;
						const isExpanded = expandedMealKey === mealKey;
						return (
							<SortableMealRow
								key={meal.tempId}
								meal={meal}
								isExpanded={isExpanded}
								onToggleExpand={() =>
									onExpandedMealKeyChange(isExpanded ? null : mealKey)
								}
								onEdit={onEdit}
								onRemove={onRemove}
							/>
						);
					})}
				</ul>
			</SortableContext>
		</DndContext>
	);
}
