import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "../context/AppState";
import { activateLocale } from "../i18n";
import { useToast } from "../components/Toast";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { exportState, importState } from "../storage/loadSave.js";

function formatSavedAt(iso, locale) {
	if (!iso) return null;
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return null;
	return d.toLocaleString(locale === "en" ? "en-US" : "es-MX", {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

function backupFilename() {
	const d = new Date();
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `malanga-backup-${yyyy}-${mm}-${dd}.json`;
}

export default function SettingsPage() {
	const { state, saveSettings, prunePastWeeks, replaceAllState } = useAppState();
	const toast = useToast();
	const { i18n } = useLingui();
	const fileInputRef = useRef(null);
	const [pruneOpen, setPruneOpen] = useState(false);
	const [restoreOpen, setRestoreOpen] = useState(false);
	const [pendingRestore, setPendingRestore] = useState(null);

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

	const lastSavedLabel = formatSavedAt(
		state.meta?.lastSavedAt,
		i18n.locale,
	);

	const onSave = async () => {
		const nextLocale = draft.locale;
		saveSettings({
			locale: nextLocale,
			weekStartsOn: Number(draft.weekStartsOn),
			calendarDefaultView: draft.calendarDefaultView,
		});
		await activateLocale(nextLocale);
		document.documentElement.lang = nextLocale;
		toast?.success?.(t`Ajustes guardados`);
	};

	const handleExport = () => {
		const json = exportState(state);
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = backupFilename();
		a.click();
		URL.revokeObjectURL(url);
		toast?.success?.(t`Copia de seguridad descargada`);
	};

	const handleFilePicked = async (e) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		try {
			const text = await file.text();
			const next = importState(text);
			setPendingRestore(next);
			setRestoreOpen(true);
		} catch {
			toast?.error?.(t`No se pudo leer el archivo. ¿Es una copia de Malanga?`);
		}
	};

	const confirmRestore = async () => {
		if (!pendingRestore) return;
		const next = replaceAllState(pendingRestore);
		setRestoreOpen(false);
		setPendingRestore(null);
		const locale = next.settings?.locale || "es";
		await activateLocale(locale);
		document.documentElement.lang = locale;
		toast?.success?.(t`Datos restaurados`);
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

			<p className="text-sm text-ink-muted -mt-4">
				<Trans>Los datos viven en este dispositivo.</Trans>
			</p>

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

			<div className="space-y-3 pt-2 border-t border-border">
				<p className="text-sm font-semibold">
					<Trans>Datos</Trans>
				</p>
				{lastSavedLabel ? (
					<p className="text-xs text-ink-muted">
						<Trans>Último guardado:</Trans>{" "}
						<span className="font-semibold text-ink">{lastSavedLabel}</span>
					</p>
				) : null}
				<p className="text-xs text-ink-muted">
					<Trans>
						Exporta una copia JSON o restaura una anterior. Restaurar reemplaza
						todo lo de este dispositivo.
					</Trans>
				</p>
				<div className="flex flex-wrap gap-2">
					<Button variant="secondary" onClick={handleExport}>
						<Trans>Exportar datos</Trans>
					</Button>
					<Button
						variant="secondary"
						onClick={() => fileInputRef.current?.click()}
					>
						<Trans>Restaurar datos</Trans>
					</Button>
					<input
						ref={fileInputRef}
						type="file"
						accept="application/json,.json"
						className="hidden"
						onChange={handleFilePicked}
					/>
				</div>
			</div>

			<div className="space-y-2 pt-2 border-t border-border">
				<p className="text-sm font-semibold">
					<Trans>Retención del calendario</Trans>
				</p>
				<p className="text-xs text-ink-muted">
					<Trans>
						Puedes borrar comidas agendadas de hace más de ~4 meses. La
						biblioteca no se toca.
					</Trans>
				</p>
				<Button variant="secondary" onClick={() => setPruneOpen(true)}>
					<Trans>Limpiar semanas pasadas</Trans>
				</Button>
			</div>

			<ConfirmDialog
				open={pruneOpen}
				danger
				title={<Trans>Limpiar semanas pasadas</Trans>}
				description={
					<Trans>
						¿Borrar del calendario todo lo anterior a hace unos 4 meses? No
						afecta la biblioteca.
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

			<ConfirmDialog
				open={restoreOpen}
				danger
				title={<Trans>Restaurar datos</Trans>}
				description={
					<Trans>
						¿Reemplazar todos los datos de este dispositivo con la copia
						seleccionada? No se puede deshacer.
					</Trans>
				}
				confirmLabel={<Trans>Restaurar</Trans>}
				onConfirm={() => {
					void confirmRestore();
				}}
				onCancel={() => {
					setRestoreOpen(false);
					setPendingRestore(null);
				}}
			/>
		</div>
	);
}
