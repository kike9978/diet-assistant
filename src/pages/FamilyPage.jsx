import { Trans } from "@lingui/react/macro";
import EmptyState from "../components/ui/EmptyState";

export default function FamilyPage() {
	return (
		<EmptyState
			title={<Trans>Familia</Trans>}
			description={
				<Trans>
					Perfiles del hogar y calendarios por miembro llegan en la fase 3. Por
					ahora trabajas como “Yo”.
				</Trans>
			}
		/>
	);
}
