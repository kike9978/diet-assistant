import { Trans } from "@lingui/react/macro";
import EmptyState from "../components/ui/EmptyState";

export default function ToolsPage() {
	return (
		<EmptyState
			title={<Trans>Herramientas</Trans>}
			description={
				<Trans>
					El convertidor crudo ↔ cocido llega en la fase 3. Las sustituciones
					siguen disponibles al planear la semana.
				</Trans>
			}
		/>
	);
}
