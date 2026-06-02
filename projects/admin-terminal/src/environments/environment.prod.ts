export const environment = {
  production: true,
  adminIdentityUrl: "https://hub.alor.ru/api",
  apiUrl: 'https://api.alor.ru',
  wsUrl: 'wss://api.alor.ru/ws',
  cwsUrl: 'wss://api.alor.ru/cws',
  clientDataUrl: 'https://lk-api.alor.ru',
  ssoUrl: 'https://login.alor.ru',
  warpUrl: 'https://warp.alor.dev',
  cmsUrl: 'https://astras.alor.ru/cmsapi',
  remoteSettingsStorageUrl: 'https://astras.alor.ru/identity/v5/UserSettings',
  alorIconsStorageUrl: 'https://storage.alorbroker.ru/icon/',
  investIdeasApiUrl: 'https://astras.alor.ru/cmsapi/v1/site/marketReview/invest-ideas',
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
  externalLinks: {
    releases: 'https://warp.alor.dev/ru/releases/astras',
    support: 'https://max.ru/join/Dd8GvcIgyG1kwve9hFau13QiGfvyQse5S5YBM7gkskY',
    issuesList: 'https://github.com/alor-broker/Astras-Trading-UI/issues',
    help: 'https://alor.dev/docs/astras'
  },
  admin: {
    identityUrl: "https://hub.alor.ru/api"
  },
  features: {
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
  },
  debug: {
    ngrx: false,
    payments: false
  }
};
