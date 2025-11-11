export const environment = {
  production: true,
  apiUrl: 'https://api.alor.ru',
  wsUrl: 'wss://api.alor.ru/ws',
  cwsUrl: 'wss://api.alor.ru/cws',
  clientDataUrl: 'https://lk-api.alor.ru',
  ssoUrl: 'https://login.alor.ru',
  warpUrl: 'https://warp.alor.dev',
  cmsUrl: 'https://astras.alor.ru/cmsapi',
  remoteSettingsStorageUrl: 'https://astras.alor.ru/identity/v5/UserSettings',
  teamlyDatabaseUrl: 'https://astras.alor.ru/teamly/api/v1/ql/content-database/content',
  alorIconsStorageUrl: 'https://storage.alorbroker.ru/icon/',
  investIdeasApiUrl: '',
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
    support: 'https://max.ru/join/Dd8GvcIgyG1kwve9hFau13QiGfvyQse5S5YBM7gkskY',
    issuesList: 'https://github.com/alor-broker/Astras-Trading-UI/issues',
    help: 'https://alor.dev/docs/astras',
    officialSite: 'https://www.alorbroker.ru',
    riskRate: 'https://www.alorbroker.ru/trading/leverage',
    personalAccount: 'https://lk.alor.ru/main',
    bankroll: 'https://lk.alor.ru/operations/money',
    services: 'https://lk.alor.ru/products/services',
    videoTutorial: 'https://www.youtube.com/watch?v=Jn0rLQlcAE0&list=PLMmnmN5fr5OQdclMyRVqIzL6RG7-LlqG3'
  },
  admin: {
    identityUrl: "https://hub.alor.ru/api"
  },
  features: {
    aiChat: true,
    lowClientRiskCheck: true,
    releases: true
  },
  internationalization: {
    ru: {
      title: "Русский"
    },
    en: {
      title: "English"
    }
  }
};
