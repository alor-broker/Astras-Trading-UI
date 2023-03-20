export const environment = {
  production: false,
  apiUrl: 'https://apidev.alor.ru',
  wsUrl: 'wss://apidev.alor.ru/ws',
  clientDataUrl: 'https://lk-api-dev.alorbroker.ru',
  ssoUrl: 'https://login-dev.alor.ru',
  warpUrl: 'https://warp.alor.dev',
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
  }
};
