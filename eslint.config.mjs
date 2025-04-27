import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
/*eslint-disable import/no-unresolved*/
import { defineConfig } from "eslint/config";
import stylisticJs from "@stylistic/eslint-plugin-js";
import importPlugin from "eslint-plugin-import";

export default defineConfig([
	// General config
	{ files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"] },

	// Server config
	{ files: ["server/**/*.{js,mjs,cjs}", "server.js"], languageOptions: { globals: globals.node, sourceType: "commonjs" } },

	// Website config
	{ files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser } },
	{ files: ["**/*.json5"], plugins: { json }, language: "json/json5", extends: ["json/recommended"] },

	// Style rules
	{
		files: ["**/*.{js,mjs,cjs}"],
		plugins: {
			"@stylistic/js": stylisticJs,
			"import": importPlugin,
		},
		rules: {
			"no-unused-vars": "off",
			"no-empty": "warn",
			"no-constant-condition": "off",
			"no-prototype-builtins": "off",
			"@stylistic/js/semi": ["error", "always"],
			"@stylistic/js/indent": ["error", "tab"],
			"@stylistic/js/quotes": ["error", "double"],
			"@stylistic/js/no-extra-semi": "warn",
			"@stylistic/js/no-trailing-spaces": ["warn", { skipBlankLines: true }],
			"@stylistic/js/no-floating-decimal": "warn",
			"import/no-unresolved": "error",
			"import/named": "error",
			"import/default": "error",
			"import/namespace": "error",
		},
	},

	// Ignore
	{
		ignores: [
			"./server/lib/socket.io.msgpack.min.js",
			"./website/game/lib/howler.core.js",
			"./website/game/lib/json5.index.min.js",
			"./website/game/lib/pdf.min.mjs",
			"./website/game/lib/pdf.worker.min.mjs",
		]
	},
]);