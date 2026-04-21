// @ts-check
const eslint = require("@eslint/js");
const { defineConfig, globalIgnores } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const stylistic = require("@stylistic/eslint-plugin");

module.exports = defineConfig([
  globalIgnores([
    ".angular/**/*",
    "dist/**/*",
    "**/charting_library/**/*",
    "android/**/*",
    "ios/**/*",
  ]),
  tseslint.configs.disableTypeChecked,
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
      stylistic.configs.customize(),

    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "ats",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "ats",
          style: "kebab-case",
        },
      ],
      "@angular-eslint/prefer-signals": [
        "error",
        {
          "preferReadonlySignalProperties": true,
          "preferInputSignals": true,
          "preferQuerySignals": true
        }
      ],

      "@typescript-eslint/consistent-type-assertions": "off",
      "@typescript-eslint/no-empty-function": [
        "error",
        {
          "allow": [
            "arrowFunctions"
          ]
        }
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "args": "after-used"
        }
      ],
      "@typescript-eslint/array-type": "error",
      "@typescript-eslint/no-unsafe-function-type": "error",
      "@typescript-eslint/no-wrapper-object-types": "error",
      "@typescript-eslint/default-param-last": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          "selector": [
            "class",
            "interface",
            "typeAlias",
            "typeParameter"
          ],
          "format": [
            "PascalCase"
          ]
        },
        {
          "selector": [
            "classMethod",
            "function",
            "parameter",
            "typeMethod"
          ],
          "format": [
            "camelCase"
          ]
        },
        {
          "selector": [
            "variable",
            "classProperty"
          ],
          "format": [
            "camelCase",
            "UPPER_CASE",
            "PascalCase"
          ]
        },
        {
          "selector": [
            "typeProperty"
          ],
          "leadingUnderscore": "allow",
          "format": [
            "camelCase",
            "PascalCase",
            "snake_case"
          ]
        }
      ],
      "@typescript-eslint/no-confusing-non-null-assertion": "error",
      "@typescript-eslint/no-duplicate-enum-values": "error",
      "@typescript-eslint/no-duplicate-type-constituents": "off",
      "@typescript-eslint/no-extra-non-null-assertion": "error",
      "@typescript-eslint/no-extraneous-class": [
        "error",
        {
          "allowStaticOnly": true,
          "allowEmpty": true
        }
      ],
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/no-misused-new": "error",
      "@typescript-eslint/no-mixed-enums": "off",
      "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "error",
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-enum-comparison": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/class-literal-property-style": "off",
      "@typescript-eslint/no-unused-expressions": "error",
      "@typescript-eslint/no-use-before-define": "error",
      "@typescript-eslint/no-useless-constructor": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-readonly": "off",
      "@typescript-eslint/prefer-string-starts-ends-with": "off",
      "@typescript-eslint/restrict-plus-operands": "off",
      "@typescript-eslint/strict-boolean-expressions": [
        "off",
        {
          "allowAny": true
        }
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "off",
      "@typescript-eslint/no-explicit-any": "off",

      "@stylistic/semi": ["error", "always"],
      "@stylistic/comma-dangle": "off",
      "@stylistic/quotes": "off",
      "@stylistic/indent": "off",
      "@stylistic/arrow-parens": "off",
      "@stylistic/object-curly-spacing": "off",
      "@stylistic/comma-spacing": "off",
      "@stylistic/brace-style": "off",
      "@stylistic/keyword-spacing": "off",
      "@stylistic/key-spacing": "off",
      "@stylistic/operator-linebreak": "off",
      "@stylistic/quote-props": "off",
      "@stylistic/member-delimiter-style": [
        "error",
        {
          "multiline": {
            "delimiter": "semi",
            "requireLast": true
          },
          "singleline": {
            "delimiter": "comma",
            "requireLast": false
          }
        }
      ],
    },
  },
  {
    files: ["**/*.spec.ts"],
    extends: [
      tseslint.configs.stylistic
    ],
    rules: {
      "@typescript-eslint/no-duplicate-type-constituents": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-explicit-any": "off"
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended
    ],
    rules: {
      "@angular-eslint/template/eqeqeq": [
        "error",
        {
          "allowNullOrUndefined": true
        }
      ]
    },
  }
]);
