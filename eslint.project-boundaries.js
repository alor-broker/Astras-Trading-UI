// @ts-check

const appProjectsRegex = String.raw`(?:desktop-terminal|mobile-terminal|admin-terminal)`;
const sharedProjectsExceptCoreRegex = String.raw`(?:terminal-widgets-lib|terminal-styling-lib|terminal-i18n)`;
const nonCoreWorkspaceProjectsRegex = String.raw`(?:${appProjectsRegex}|${sharedProjectsExceptCoreRegex}|testing-lib)`;

const projectPathRegex = projectNamesRegex =>
  String.raw`^(?:projects/)?${projectNamesRegex}(?:/|$)|^(?:\.\.?/)+(?:projects/)?${projectNamesRegex}(?:/|$)`;

const restrictedImportsRule = patterns => [
  "error",
  {
    patterns
  }
];

const createAppProjectImportRestrictions = projectNamesRegex => [
  {
    regex: projectPathRegex(projectNamesRegex),
    message: "Applications must not import files from other application projects."
  }
];

const desktopAppProjectImportRestrictions = createAppProjectImportRestrictions(
  String.raw`(?:mobile-terminal|admin-terminal)`
);
const mobileAppProjectImportRestrictions = createAppProjectImportRestrictions(
  String.raw`(?:desktop-terminal|admin-terminal)`
);
const adminAppProjectImportRestrictions = createAppProjectImportRestrictions(
  String.raw`(?:desktop-terminal|mobile-terminal)`
);

const testingLibImportRestrictions = [
  {
    regex: String.raw`^@testing-lib(?:/|$)|${projectPathRegex(String.raw`(?:testing-lib)`)}`,
    message: "testing-lib can be imported only from test files."
  }
];

const coreLibImportRestrictions = [
  {
    regex: String.raw`^(?:@terminal-widgets-lib|@terminal-styling-lib)(?:/|$)|^terminal-i18n(?:/|$)`,
    message: "terminal-core-lib must not import other workspace projects."
  },
  {
    regex: projectPathRegex(nonCoreWorkspaceProjectsRegex),
    message: "terminal-core-lib must not import other workspace projects."
  }
];

const widgetsLibImportRestrictions = [
  {
    regex: String.raw`^@terminal-styling-lib(?:/|$)|^terminal-i18n(?:/|$)`,
    message: "terminal-widgets-lib can import terminal-core-lib and itself, but not other workspace libraries."
  },
  {
    regex: projectPathRegex(String.raw`(?:${appProjectsRegex}|terminal-styling-lib|terminal-i18n)`),
    message: "terminal-widgets-lib can import terminal-core-lib and itself, but not other workspace projects."
  }
];

const testingLibProjectRestrictions = [
  {
    regex: String.raw`^(?:@terminal-widgets-lib|@terminal-styling-lib)(?:/|$)|^terminal-i18n(?:/|$)`,
    message: "testing-lib can depend on terminal-core-lib test contracts, but not apps or other workspace libraries."
  },
  {
    regex: projectPathRegex(String.raw`(?:${appProjectsRegex}|terminal-widgets-lib|terminal-styling-lib|terminal-i18n)`),
    message: "testing-lib can depend on terminal-core-lib test contracts, but not apps or other workspace libraries."
  }
];

module.exports = [
  {
    files: ["projects/desktop-terminal/src/**/*.ts"],
    ignores: ["**/*.spec.ts"],
    rules: {
      "no-restricted-imports": restrictedImportsRule([
        ...desktopAppProjectImportRestrictions,
        ...testingLibImportRestrictions
      ])
    }
  },
  {
    files: ["projects/mobile-terminal/src/**/*.ts"],
    ignores: ["**/*.spec.ts"],
    rules: {
      "no-restricted-imports": restrictedImportsRule([
        ...mobileAppProjectImportRestrictions,
        ...testingLibImportRestrictions
      ])
    }
  },
  {
    files: ["projects/admin-terminal/src/**/*.ts"],
    ignores: ["**/*.spec.ts"],
    rules: {
      "no-restricted-imports": restrictedImportsRule([
        ...adminAppProjectImportRestrictions,
        ...testingLibImportRestrictions
      ])
    }
  },
  {
    files: ["projects/desktop-terminal/src/**/*.spec.ts"],
    rules: {
      "no-restricted-imports": restrictedImportsRule(desktopAppProjectImportRestrictions)
    }
  },
  {
    files: ["projects/mobile-terminal/src/**/*.spec.ts"],
    rules: {
      "no-restricted-imports": restrictedImportsRule(mobileAppProjectImportRestrictions)
    }
  },
  {
    files: ["projects/admin-terminal/src/**/*.spec.ts"],
    rules: {
      "no-restricted-imports": restrictedImportsRule(adminAppProjectImportRestrictions)
    }
  },
  {
    files: ["projects/terminal-core-lib/src/**/*.ts"],
    ignores: ["**/*.spec.ts"],
    rules: {
      "no-restricted-imports": restrictedImportsRule([
        ...coreLibImportRestrictions,
        ...testingLibImportRestrictions
      ])
    }
  },
  {
    files: ["projects/terminal-core-lib/src/**/*.spec.ts"],
    rules: {
      "no-restricted-imports": restrictedImportsRule(coreLibImportRestrictions)
    }
  },
  {
    files: ["projects/terminal-widgets-lib/src/**/*.ts"],
    ignores: ["**/*.spec.ts"],
    rules: {
      "no-restricted-imports": restrictedImportsRule([
        ...widgetsLibImportRestrictions,
        ...testingLibImportRestrictions
      ])
    }
  },
  {
    files: ["projects/terminal-widgets-lib/src/**/*.spec.ts"],
    rules: {
      "no-restricted-imports": restrictedImportsRule(widgetsLibImportRestrictions)
    }
  },
  {
    files: ["projects/testing-lib/src/**/*.ts"],
    rules: {
      "no-restricted-imports": restrictedImportsRule(testingLibProjectRestrictions)
    }
  }
];
