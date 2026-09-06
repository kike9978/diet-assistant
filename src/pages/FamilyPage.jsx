import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useState } from "react";
import { X } from "lucide-react";
import { useAppState } from "../context/AppState";
import { MEMBER_COLORS } from "../features/family/memberColors.js";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import Sheet from "../components/ui/Sheet";

export default function FamilyPage() {
	const {
		state,
		addHouseholdMember,
		updateHouseholdMember,
		removeHouseholdMember,
		setActiveMember,
	} = useAppState();
	const members = state.household.members;
	const [sheetOpen, setSheetOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [name, setName] = useState("");
	const [color, setColor] = useState(MEMBER_COLORS[0]);
	const [deleteId, setDeleteId] = useState(null);
	const [error, setError] = useState(null);

	const openCreate = () => {
		setEditing(null);
		setName("");
		setColor(MEMBER_COLORS[members.length % MEMBER_COLORS.length]);
		setError(null);
		setSheetOpen(true);
	};

	const openEdit = (member) => {
		setEditing(member);
		setName(member.name);
		setColor(member.color);
		setError(null);
		setSheetOpen(true);
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) {
			setError(t`Ponle un nombre al perfil.`);
			return;
		}
		if (editing) {
			updateHouseholdMember(editing.id, { name: trimmed, color });
		} else {
			addHouseholdMember({ name: trimmed, color });
		}
		setSheetOpen(false);
	};

	if (members.length === 0) {
		return (
			<EmptyState
				title={<Trans>Familia</Trans>}
				description={<Trans>Añade perfiles del hogar en este dispositivo.</Trans>}
				actionLabel={<Trans>Añadir persona</Trans>}
				onAction={openCreate}
			/>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3 flex-wrap">
				<div>
					<h1 className="font-display text-2xl text-ink">
						<Trans>Familia</Trans>
					</h1>
					<p className="text-sm text-ink-muted mt-0.5">
						<Trans>
							Cada persona tiene su propio calendario. En Compras puedes
							combinar varios.
						</Trans>
					</p>
				</div>
				<Button onClick={openCreate}>
					<Trans>Añadir</Trans>
				</Button>
			</div>

			<ul className="border border-border rounded-app bg-surface divide-y divide-border overflow-hidden">
				{members.map((member) => {
					const isActive = member.id === state.household.activeMemberId;
					const mealCount = Object.values(
						state.calendars[member.id] || {},
					).reduce((n, day) => n + (day?.length || 0), 0);

					return (
						<li
							key={member.id}
							className="flex items-center gap-3 px-4 py-3 min-h-11"
						>
							<button
								type="button"
								onClick={() => setActiveMember(member.id)}
								className="flex items-center gap-3 min-w-0 flex-1 text-left"
								aria-pressed={isActive}
							>
								<span
									className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-[var(--color-surface)]"
									style={{
										backgroundColor: member.color,
										boxShadow: isActive
											? `0 0 0 2px ${member.color}`
											: undefined,
									}}
									aria-hidden
								/>
								<div className="min-w-0">
									<p className="font-semibold text-ink truncate">
										{member.name}
										{isActive ? (
											<span className="ml-2 text-xs font-semibold text-brand">
												<Trans>activo</Trans>
											</span>
										) : null}
									</p>
									<p className="text-xs text-ink-muted">
										{mealCount}{" "}
										{mealCount === 1 ? (
											<Trans>comida agendada</Trans>
										) : (
											<Trans>comidas agendadas</Trans>
										)}
									</p>
								</div>
							</button>
							<Button
								variant="secondary"
								className="!px-3 shrink-0"
								onClick={() => openEdit(member)}
							>
								<Trans>Editar</Trans>
							</Button>
							{members.length > 1 ? (
								<Button
									variant="ghost"
									className="!px-2 shrink-0"
									aria-label={t`Eliminar ${member.name}`}
									onClick={() => setDeleteId(member.id)}
								>
									<X className="size-4" aria-hidden />
								</Button>
							) : null}
						</li>
					);
				})}
			</ul>

			<Sheet
				open={sheetOpen}
				onClose={() => setSheetOpen(false)}
				title={
					editing ? (
						<Trans>Editar perfil</Trans>
					) : (
						<Trans>Nueva persona</Trans>
					)
				}
				footer={
					<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
						<Button variant="secondary" onClick={() => setSheetOpen(false)}>
							<Trans>Cancelar</Trans>
						</Button>
						<Button type="submit" form="family-form">
							<Trans>Guardar</Trans>
						</Button>
					</div>
				}
			>
				<form id="family-form" onSubmit={handleSubmit} className="space-y-4">
					<label className="block">
						<span className="text-sm font-semibold">
							<Trans>Nombre</Trans>
						</span>
						<input
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="mt-1 w-full min-h-11 px-3 rounded-app border border-border bg-surface"
							placeholder={t`Ej. Ana`}
							autoFocus
						/>
					</label>
					<fieldset>
						<legend className="text-sm font-semibold mb-2">
							<Trans>Color</Trans>
						</legend>
						<div className="flex flex-wrap gap-2">
							{MEMBER_COLORS.map((c) => (
								<button
									key={c}
									type="button"
									onClick={() => setColor(c)}
									className={`w-10 h-10 rounded-full border-2 ${color === c ? "border-ink scale-110" : "border-transparent"
										}`}
									style={{ backgroundColor: c }}
									aria-label={t`Color ${c}`}
									aria-pressed={color === c}
								/>
							))}
						</div>
					</fieldset>
					{error ? (
						<p className="text-sm text-[var(--color-danger)]">{error}</p>
					) : null}
				</form>
			</Sheet>

			<ConfirmDialog
				open={Boolean(deleteId)}
				danger
				title={<Trans>Eliminar perfil</Trans>}
				description={
					<Trans>
						Se borrará su calendario en este dispositivo. No se puede deshacer.
					</Trans>
				}
				confirmLabel={<Trans>Eliminar</Trans>}
				onConfirm={() => {
					if (deleteId) removeHouseholdMember(deleteId);
					setDeleteId(null);
				}}
				onCancel={() => setDeleteId(null)}
			/>
		</div>
	);
}
