// @ts-check
const { defineConfig } = require("eslint/config");
const baseConfig = require("./eslint.config.js");

const typedAwareTsRules = {
  "@typescript-eslint/no-duplicate-type-constituents": "error",
  "@typescript-eslint/no-mixed-enums": "error",
  "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
  "@typescript-eslint/no-unsafe-assignment": "error",
  "@typescript-eslint/no-unsafe-enum-comparison": "error",
  "@typescript-eslint/no-unsafe-return": "error",
  "@typescript-eslint/prefer-nullish-coalescing": "error",
  "@typescript-eslint/prefer-readonly": "error",
  "@typescript-eslint/prefer-string-starts-ends-with": "error",
  "@typescript-eslint/restrict-plus-operands": "error",
  "@typescript-eslint/strict-boolean-expressions": [
    "error",
    {
      allowAny: true,
    },
  ],
};

module.exports = defineConfig([
  ...baseConfig,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "@angular-eslint/prefer-signals": [
        "error",
        {
          preferReadonlySignalProperties: true,
          preferInputSignals: true,
          preferQuerySignals: true,
          useTypeChecking: true,
        },
      ],
      ...typedAwareTsRules,
    },
  },
  {
    files: ["**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-duplicate-type-constituents": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);
