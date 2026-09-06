import { defineConfig } from "@lingui/conf";
import { formatter } from "@lingui/format-po";

export default defineConfig({
	sourceLocale: "es",
	locales: ["es", "en"],
	catalogs: [
		{
			path: "<rootDir>/src/locales/{locale}/messages",
			include: ["src"],
		},
	],
	format: formatter({ lineNumbers: false }),
});
