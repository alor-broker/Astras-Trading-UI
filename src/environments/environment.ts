// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// export const environment = {
//   production: true,
//   apiUrl: 'https://api.alor.ru',
//   wsUrl: 'wss://api.alor.ru/ws',
//   clientDataUrl: 'https://lk-api.alor.ru',
//   ssoUrl: 'https://login.alor.ru'
// };

export const environment = {
  production: false,
  apiUrl: 'https://apidev.alor.ru',
  wsUrl: 'wss://apidev.alor.ru/ws',
  clientDataUrl: 'https://lk-api-dev.alorbroker.ru',
  ssoUrl: 'https://login-dev.alor.ru',
  warpUrl: 'https://warp.alor.dev',
  remoteSettingsStorageUrl: 'https://astras-dev.alor.ru/identity/v5/UserSettings',
  logging: {
    console: {
      minLevel: 'trace'
    },
    remote: null
  },
  firebase: {
    apiKey: "AIzaSyCI0yjnNuT8VWJG4ow38-iY231ZoTGxV-o",
    authDomain: "lessgo-alor.firebaseapp.com",
    projectId: "lessgo-alor",
    storageBucket: "lessgo-alor.appspot.com",
    messagingSenderId: "766412584747",
    appId: "1:766412584747:web:5f84a1aaf533f01013776e"
  },
  externalLinks: {
    reports: 'https://lk.alor.ru/reports/broker',
    releases: 'https://warp.alor.dev/ru/releases/astras',
    support: 'https://t.me/+oM0i9QbtD4cwMzNi',
    help: 'https://alor.gitbook.io/astras',
    officialSite: 'https://www.alorbroker.ru',
    riskRate: 'https://www.alorbroker.ru/trading/leverage',
    personalAccount: 'https://lk.alor.ru/main',
    bankroll: 'https://lk.alor.ru/operations/money',
    services: 'https://lk.alor.ru/products/services'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
