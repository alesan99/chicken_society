import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import { defineConfig } from "eslint/config";
import stylisticJs from "@stylistic/eslint-plugin-js";

export default defineConfig([
	// General config
	{ files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"] },

	// Server config
	{ files: ["server/**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.node, sourceType: "commonjs" } },

	// Website config
	{ files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser } },
	{ files: ["**/*.json5"], plugins: { json }, language: "json/json5", extends: ["json/recommended"] },

	// Style rules
	{
		plugins: {
			"@stylistic/js": stylisticJs
		},
		rules: {
			"no-unused-vars": "warn",
			"@stylistic/js/semi": ["error", "always"],
			"@stylistic/js/indent": ["error", "tab"],
			"@stylistic/js/quotes": ["error", "double"],
			"@stylistic/js/no-extra-semi": "warn",
			"@stylistic/js/no-trailing-spaces": ["warn", { skipBlankLines: true }],
			"@stylistic/js/no-floating-decimal": "warn",
		},
	},
]);