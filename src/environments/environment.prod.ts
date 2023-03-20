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
  }
};
