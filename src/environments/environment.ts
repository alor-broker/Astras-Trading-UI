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
  ssoUrl: 'https://login-dev.alor.ru'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
