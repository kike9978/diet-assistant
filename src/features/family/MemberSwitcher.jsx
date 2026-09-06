import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAppState } from "../../context/AppState";

/**
 * Compact household switcher for the app header.
 */
export default function MemberSwitcher() {
	const { state, setActiveMember, activeMember } = useAppState();
	const members = state.household.members;

	if (members.length <= 1) {
		return (
			<Link
				to="/family"
				className="inline-flex items-center gap-2 min-h-11 px-2 rounded-app text-sm font-semibold text-white/90 hover:bg-white/15"
				title={t`Familia`}
			>
				<span
					className="w-2.5 h-2.5 rounded-full shrink-0"
					style={{ backgroundColor: activeMember?.color || "#fff" }}
					aria-hidden
				/>
				<span className="max-w-[7rem] truncate hidden xs:inline sm:inline">
					{activeMember?.name || "Yo"}
				</span>
			</Link>
		);
	}

	return (
		<div
			className="flex items-center gap-1 max-w-[50vw] overflow-x-auto"
			role="group"
			aria-label={t`Cambiar persona`}
		>
			{members.map((member) => {
				const active = member.id === state.household.activeMemberId;
				return (
					<button
						key={member.id}
						type="button"
						onClick={() => setActiveMember(member.id)}
						className={`inline-flex items-center gap-1.5 min-h-11 px-2.5 rounded-app text-sm font-semibold shrink-0 ${
							active
								? "bg-white text-brand"
								: "text-white/85 hover:bg-white/15"
						}`}
						aria-pressed={active}
						title={member.name}
					>
						<span
							className="w-2.5 h-2.5 rounded-full shrink-0"
							style={{ backgroundColor: member.color }}
							aria-hidden
						/>
						<span className="max-w-[5.5rem] truncate">{member.name}</span>
					</button>
				);
			})}
			<Link
				to="/family"
				className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-app text-white/80 hover:bg-white/15 text-lg"
				aria-label={t`Gestionar familia`}
				title={t`Familia`}
			>
				<Plus className="size-5" aria-hidden />
			</Link>
		</div>
	);
}

export function MemberSwitcherHint() {
	return (
		<p className="sr-only">
			<Trans>Selector de perfil del hogar</Trans>
		</p>
	);
}
