import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { useEffect, useState } from "react";

export { i18n };

/**
 * Dynamically load and activate a compiled catalog.
 * @param {"es" | "en"} locale
 */
export async function activateLocale(locale) {
	const { messages } = await import(`./locales/${locale}/messages.po`);
	i18n.load(locale, messages);
	i18n.activate(locale);
}

export function AppI18nProvider({ locale = "es", children }) {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setReady(false);
		(async () => {
			await activateLocale(locale);
			if (!cancelled) {
				document.documentElement.lang = locale;
				setReady(true);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [locale]);

	if (!ready) {
		return (
			<div className="min-h-dvh flex items-center justify-center bg-bg text-ink">
				<span className="text-sm opacity-70">
					{locale === "en" ? "Loading…" : "Cargando…"}
				</span>
			</div>
		);
	}

	return (
		<I18nProvider key={locale} i18n={i18n}>
			{children}
		</I18nProvider>
	);
}
