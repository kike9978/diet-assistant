import { Trans } from "@lingui/react/macro";
import EmptyState from "../components/ui/EmptyState";

export default function PantryPage() {
	return (
		<EmptyState
			title={<Trans>Despensa</Trans>}
			description={
				<Trans>
					El inventario llega en la fase 3. Mientras tanto, marca “ya lo tengo”
					en la lista de compras.
				</Trans>
			}
		/>
	);
}
