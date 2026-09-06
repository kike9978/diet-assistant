import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { lingui } from "@lingui/vite-plugin";
import linguiMacro from "@lingui/babel-plugin-lingui-macro";

export default defineConfig({
	plugins: [
		react({
			babel: {
				// Must run so `@lingui/*/macro` imports are compiled away before the browser.
				plugins: [linguiMacro],
			},
		}),
		lingui(),
		tailwindcss(),
	],
	optimizeDeps: {
		// Never serve the browser macro stub (it throws on import).
		exclude: ["@lingui/react/macro", "@lingui/core/macro"],
	},
	test: {
		environment: "node",
		include: ["src/**/*.test.js"],
	},
});
