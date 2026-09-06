import { Trans } from "@lingui/react/macro";
import { useAppState } from "../../context/AppState";

/**
 * Multi-select which household calendars feed the shopping list.
 */
export default function ShoppingMemberPicker() {
	const { state, setShoppingMemberIds } = useAppState();
	const members = state.household.members;
	const selected = new Set(
		state.ui.shoppingMemberIds?.length
			? state.ui.shoppingMemberIds
			: [state.household.activeMemberId],
	);

	if (members.length <= 1) return null;

	const toggle = (id) => {
		const next = new Set(selected);
		if (next.has(id)) {
			if (next.size <= 1) return;
			next.delete(id);
		} else {
			next.add(id);
		}
		setShoppingMemberIds([...next]);
	};

	return (
		<div className="space-y-2">
			<p className="text-sm font-semibold text-ink">
				<Trans>Incluir en la compra</Trans>
			</p>
			<div className="flex flex-wrap gap-2">
				{members.map((member) => {
					const on = selected.has(member.id);
					return (
						<button
							key={member.id}
							type="button"
							onClick={() => toggle(member.id)}
							aria-pressed={on}
							className={`inline-flex items-center gap-2 min-h-11 px-3 rounded-app border text-sm font-semibold ${
								on
									? "border-brand bg-[var(--color-accent-leaf)]/15 text-ink"
									: "border-border bg-surface text-ink-muted"
							}`}
						>
							<span
								className="w-2.5 h-2.5 rounded-full"
								style={{ backgroundColor: member.color }}
								aria-hidden
							/>
							{member.name}
						</button>
					);
				})}
			</div>
		</div>
	);
}
