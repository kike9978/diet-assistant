import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import { activateLocale } from "../i18n";
import { useToast } from "../components/Toast";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";

export default function SettingsPage() {
	const {
		state,
		saveSettings,
		reiniciar,
		saveCurrentAsTemplate,
		prunePastWeeks,
	} = useAppState();
	const toast = useToast();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pruneOpen, setPruneOpen] = useState(false);
	const navigate = useNavigate();

	const [draft, setDraft] = useState(() => ({
		locale: state.settings.locale,
		weekStartsOn: state.settings.weekStartsOn,
		calendarDefaultView:
			state.settings.calendarDefaultView === "month" ? "month" : "week",
	}));

	useEffect(() => {
		setDraft({
			locale: state.settings.locale,
			weekStartsOn: state.settings.weekStartsOn,
			calendarDefaultView:
				state.settings.calendarDefaultView === "month" ? "month" : "week",
		});
	}, [
		state.settings.locale,
		state.settings.weekStartsOn,
		state.settings.calendarDefaultView,
	]);

	const dirty = useMemo(() => {
		return (
			draft.locale !== state.settings.locale ||
			draft.weekStartsOn !== state.settings.weekStartsOn ||
			draft.calendarDefaultView !== state.settings.calendarDefaultView
		);
	}, [draft, state.settings]);

	const onSave = async () => {
		const nextLocale = draft.locale;
		saveSettings({
			locale: nextLocale,
			weekStartsOn: Number(draft.weekStartsOn),
			calendarDefaultView: draft.calendarDefaultView,
		});
		await activateLocale(nextLocale);
		document.documentElement.lang = nextLocale;
		toast?.success?.(
			nextLocale === "en" ? t`Ajustes guardados` : t`Ajustes guardados`,
		);
	};

	const confirmReset = () => {
		reiniciar();
		setConfirmOpen(false);
		navigate("/");
	};

	return (
		<div className="max-w-lg space-y-8">
			<div className="flex items-start justify-between gap-3 flex-wrap">
				<h1 className="font-display text-2xl">
					<Trans>Ajustes</Trans>
				</h1>
				<Button onClick={onSave} disabled={!dirty}>
					<Trans>Guardar ajustes</Trans>
				</Button>
			</div>

			<label className="block space-y-1">
				<span className="text-sm font-semibold">
					<Trans>Idioma</Trans>
				</span>
				<select
					value={draft.locale}
					onChange={(e) =>
						setDraft((d) => ({ ...d, locale: e.target.value }))
					}
					className="w-full min-h-11 px-3 rounded-app border border-border bg-surface"
				>
					<option value="es">Español</option>
					<option value="en">English</option>
				</select>
			</label>

			<label className="block space-y-1">
				<span className="text-sm font-semibold">
					<Trans>La semana empieza en</Trans>
				</span>
				<select
					value={draft.weekStartsOn}
					onChange={(e) =>
						setDraft((d) => ({
							...d,
							weekStartsOn: Number(e.target.value),
						}))
					}
					className="w-full min-h-11 px-3 rounded-app border border-border bg-surface"
				>
					<option value={0}>
						<Trans>Domingo</Trans>
					</option>
					<option value={1}>
						<Trans>Lunes</Trans>
					</option>
					<option value={6}>
						<Trans>Sábado</Trans>
					</option>
				</select>
			</label>

			<label className="block space-y-1">
				<span className="text-sm font-semibold">
					<Trans>Vista de calendario por defecto</Trans>
				</span>
				<select
					value={draft.calendarDefaultView}
					onChange={(e) =>
						setDraft((d) => ({
							...d,
							calendarDefaultView: e.target.value,
						}))
					}
					className="w-full min-h-11 px-3 rounded-app border border-border bg-surface"
				>
					<option value="week">
						<Trans>Semana</Trans>
					</option>
					<option value="month">
						<Trans>Mes</Trans>
					</option>
				</select>
			</label>

			{dirty ? (
				<p className="text-sm text-[var(--color-accent-citrus)]">
					<Trans>Hay cambios sin guardar.</Trans>
				</p>
			) : (
				<p className="text-sm text-ink-muted">
					<Trans>Todos los cambios están guardados.</Trans>
				</p>
			)}

			<div className="space-y-2 pt-2 border-t border-border">
				<p className="text-sm font-semibold">
					<Trans>Plantilla y reinicio</Trans>
				</p>
				<Button variant="secondary" onClick={() => saveCurrentAsTemplate()}>
					<Trans>Guardar plantilla</Trans>
				</Button>
				<p className="text-xs text-ink-muted">
					<Trans>
						Reiniciar limpia el calendario y la lista de compras, pero conserva
						biblioteca, plantillas, despensa y ajustes.
					</Trans>
				</p>
				<Button variant="danger" onClick={() => setConfirmOpen(true)}>
					<Trans>Reiniciar plan</Trans>
				</Button>
			</div>

			<div className="space-y-2 pt-2 border-t border-border">
				<p className="text-sm font-semibold">
					<Trans>Retención del calendario</Trans>
				</p>
				<p className="text-xs text-ink-muted">
					<Trans>
						Puedes borrar comidas agendadas de hace más de ~4 meses. Biblioteca
						y plantillas no se tocan.
					</Trans>
				</p>
				<Button variant="secondary" onClick={() => setPruneOpen(true)}>
					<Trans>Limpiar semanas pasadas</Trans>
				</Button>
			</div>

			<ConfirmDialog
				open={confirmOpen}
				danger
				title={<Trans>Reiniciar plan</Trans>}
				description={
					<Trans>
						¿Seguro? Se borrarán calendarios, checklist, prep y extras. La
						biblioteca y las plantillas se quedan.
					</Trans>
				}
				confirmLabel={<Trans>Reiniciar</Trans>}
				onConfirm={confirmReset}
				onCancel={() => setConfirmOpen(false)}
			/>

			<ConfirmDialog
				open={pruneOpen}
				danger
				title={<Trans>Limpiar semanas pasadas</Trans>}
				description={
					<Trans>
						¿Borrar del calendario todo lo anterior a hace unos 4 meses?
					</Trans>
				}
				confirmLabel={<Trans>Limpiar</Trans>}
				onConfirm={() => {
					prunePastWeeks({ keepMonths: 4 });
					setPruneOpen(false);
					toast?.success?.(t`Semanas pasadas limpiadas`);
				}}
				onCancel={() => setPruneOpen(false)}
			/>
		</div>
	);
}
