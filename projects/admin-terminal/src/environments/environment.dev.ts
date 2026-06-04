export const environment = {
  production: false,
  adminIdentityUrl: "https://hub.dev.alor.ru/api",
  apiUrl: 'https://apidev.alor.ru',
  wsUrl: 'wss://apidev.alor.ru/ws',
  cwsUrl: 'wss://apidev.alor.ru/cws',
  clientDataUrl: 'https://lk-api-dev.alorbroker.ru',
  ssoUrl: 'https://login-dev.alor.ru',
  warpUrl: 'https://warp.alor.dev',
  cmsUrl: 'https://astras-dev.alor.ru/cmsapi',
  remoteSettingsStorageUrl: 'https://astras-dev.alor.ru/identity/v5/UserSettings',
  alorIconsStorageUrl: 'https://storage.alorbroker.ru/icon/',
  investIdeasApiUrl: 'https://api.dev.alor.ru/cmsapi/v1/site/marketReview/invest-ideas',
  logging: {
    console: {
      minLevel: 'trace'
    },
    remote: {
      minLevel: 'trace',
      environment: 'dev',
      loggingServerUrl: 'https://astras-dev.alor.ru/eslogs',
      authorization: {
        name: '',
        password: ''
      }
    }
  },
  externalLinks: {
    releases: 'https://warp.alor.dev/ru/releases/astras',
    support: 'https://max.ru/join/Dd8GvcIgyG1kwve9hFau13QiGfvyQse5S5YBM7gkskY',
    issuesList: 'https://github.com/alor-broker/Astras-Trading-UI/issues',
    help: 'https://alor.dev/docs/astras'
  },
  features: {
    lowClientRiskCheck: true,
    releases: true,
  },
  internationalization: {
    ru: {
      title: "Русский"
    },
    en: {
      title: "English"
    }
  },
  debug: {
    ngrx: true,
    payments: true
  }
};
