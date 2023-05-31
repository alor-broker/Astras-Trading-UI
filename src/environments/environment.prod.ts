export const environment = {
  production: true,
  apiUrl: 'https://api.alor.ru',
  wsUrl: 'wss://api.alor.ru/ws',
  clientDataUrl: 'https://lk-api.alor.ru',
  ssoUrl: 'https://login.alor.ru',
  warpUrl: 'https://warp.alor.dev',
  logging: {
    console: {
      minLevel: 'error'
    },
    remote: {
      minLevel: 'warn',
      environment: 'prod',
      loggingServerUrl: 'https://astras-dev.alor.ru/eslogs',
      authorization: {
        name: '',
        password: ''
      }
    }
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
    officialSite: 'https://www.alorbroker.ru',
    riskRate: 'https://www.alorbroker.ru/trading/leverage',
    personalAccount: 'https://lk.alor.ru/main',
    bankroll: 'https://lk.alor.ru/operations/money',
    services: 'https://lk.alor.ru/products/services'
  }
};
