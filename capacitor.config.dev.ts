import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ru.alor.astras',
  appName: 'Astras',
  webDir: 'dist/astras',
  server: {
    url: 'http://10.0.2.2:4200',
    cleartext: true,
    allowNavigation: [
      'login.alor.ru',
      'login-dev.alor.ru',
      'apidev.alor.ru',
      'api.alor.ru',
      'lk-api-dev.alorbroker.ru',
      'lk-api.alor.ru',
      'astras-dev.alor.ru',
      'astras.alor.ru'
    ]
  },
  "plugins": {
    "CapacitorHttp": {
      "enabled": true
    }
  }
};

export default config;
