import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import eslintConfigPrettier from "eslint-config-prettier";
import react from "eslint-plugin-react";

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    ...pluginReactConfig,
    rules: {
      ...pluginReactConfig.rules,
      "react/jsx-uses-react": 2,
      "react/jsx-uses-vars": 2,
      "react/react-in-jsx-scope": 0,
    },
    settings: {
      ...pluginReactConfig.settings,
      react: {
        version: "detect",
      },
    },
  },
];
