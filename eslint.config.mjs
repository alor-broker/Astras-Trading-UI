import tseslint from "typescript-eslint";
import {defineConfig, globalIgnores} from "eslint/config";
import angular from "angular-eslint";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig([
  globalIgnores([
    ".angular/**/*",
    "dist/**/*",
    "**/charting_library/**/*"
  ]),
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: true
      }
    },
    extends: [
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      stylistic.configs['recommended'],
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
      "@angular-eslint/prefer-inject": "off",
      "@angular-eslint/prefer-signals": [
        "error",
        {
          "preferReadonlySignalProperties": true,
          "preferInputSignals": true,
          "preferQuerySignals": true,
          "useTypeChecking": true
        }
      ],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/comma-dangle": "off",
      "@stylistic/quotes": "off",
      "@stylistic/indent": "off",
      "@object-curly-spacing": "off",
      "@stylistic/arrow-parens": "off",
      "@stylistic/object-curly-spacing": "off",
      "@stylistic/comma-spacing": "off",
      "@stylistic/brace-style": "off",
      "@stylistic/keyword-spacing": "off",
      "@stylistic/key-spacing": "off",
      "@typescript-eslint/class-literal-property-style": "off",
      "@stylistic/operator-linebreak": "off",
      "@stylistic/quote-props": "off",


      "@typescript-eslint/consistent-type-assertions": "off",
      "no-empty-function": "off",
      "@typescript-eslint/no-empty-function": [
        "error",
        {
          "allow": [
            "arrowFunctions"
          ]
        }
      ],

      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "args": "after-used"
        }
      ],
      "@typescript-eslint/array-type": "error",
      "@typescript-eslint/no-unsafe-function-type": "error",
      "@typescript-eslint/no-wrapper-object-types": "error",
      "default-param-last": "off",
      "@typescript-eslint/default-param-last": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
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
      "@typescript-eslint/no-duplicate-type-constituents": "error",
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
      "@typescript-eslint/no-mixed-enums": "error",
      "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "error",
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-enum-comparison": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "no-unused-expressions": "off",
      "@typescript-eslint/no-unused-expressions": "error",
      "no-use-before-define": "off",
      "@typescript-eslint/no-use-before-define": "error",
      "no-useless-constructor": "off",
      "@typescript-eslint/no-useless-constructor": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/prefer-string-starts-ends-with": "error",
      "@typescript-eslint/restrict-plus-operands": "error",
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
          "allowAny": true
        }
      ],
      "@angular-eslint/prefer-standalone": "off",
      "@typescript-eslint/switch-exhaustiveness-check": "off"
    },
  },
  {
    files: ["**/*.spec.ts"],
    extends: [
      ...tseslint.configs.stylistic
    ],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off"
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
    ],
    rules: {
      "@angular-eslint/template/eqeqeq": [
        "error",
        {
          "allowNullOrUndefined": true
        }
      ]
    },
  },
]);
