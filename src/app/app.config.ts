import {
  ApplicationConfig,
  ErrorHandler,
  importProvidersFrom,
  inject,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners
} from "@angular/core";
import {StoreModule} from "@ngrx/store";
import {EffectsModule} from "@ngrx/effects";
import {MarkdownModule} from "ngx-markdown";
import {JoyrideModule} from "ngx-joyride";
import {TranslocoRootModule} from "./transloco-root.module";
import {ServiceWorkerModule} from "@angular/service-worker";
import {NzModalModule} from "ng-zorro-antd/modal";
import {extModules, extProvides} from "./build-specifics/ext-modules";
import {provideRouter, withComponentInputBinding} from "@angular/router";
import {routes} from "./app.routes";
import {LocaleService} from "./shared/services/locale.service";
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {AuthInterceptor} from "./shared/interceptors/auth.interceptor";
import {ErrorHandlerService} from "./shared/services/handle-error/error-handler.service";
import {LOGGER} from "./shared/services/logging/logger-base";
import {ConsoleLogger} from "./shared/services/logging/console-logger";
import {RemoteLogger} from "./shared/services/logging/remote-logger";
import {ERROR_HANDLER} from "./shared/services/handle-error/error-handler";
import {HttpErrorHandler} from "./shared/services/handle-error/http-error-handler";
import {LogErrorHandler} from "./shared/services/handle-error/log-error-handler";
import {GraphQlErrorHandlerService} from "./shared/services/handle-error/graph-ql-error-handler.service";
import {NOTIFICATIONS_PROVIDER} from "./modules/notifications/services/notifications-provider";
import {FeedbackNotificationsProvider} from "./modules/feedback/services/feedback-notifications-provider";
import {PushNotificationsProvider} from "./modules/push-notifications/services/push-notifications-provider";
import {
  ApplicationReleaseNotificationProvider
} from "./modules/application-meta/services/application-release-notification-provider";
import {APP_HOOKS} from "./app-hooks";
import {provideCharts, withDefaultRegisterables} from "ng2-charts";
import {provideNamedApollo} from "apollo-angular";
import {HttpLink} from "apollo-angular/http";
import {environment} from "../environments/environment";
import {InMemoryCache} from "@apollo/client";
import {provideAnimations} from "@angular/platform-browser/animations";

// DO NOT REMOVE. This import is required for chart.js
import "chartjs-adapter-date-fns";

// angular providers
const coreProviders = [
  provideBrowserGlobalErrorListeners(),
  provideRouter(
    routes,
    withComponentInputBinding()
  ),
  provideHttpClient(withInterceptorsFromDi()),
  provideAnimations()
];

// backward compatibility providers
const moduleProviders = importProvidersFrom(
  StoreModule.forRoot({}),
  EffectsModule.forRoot(),
  MarkdownModule.forRoot(),
  JoyrideModule.forRoot(),
  TranslocoRootModule,
  ServiceWorkerModule.register(
    'ngsw-worker.js',
    {
      enabled: true,
      // Register the ServiceWorker as soon as the application is stable
      // or after 15 seconds (whichever comes first).
      // registrationStrategy: 'registerWhenStable:15000'
    },
  ),
  NzModalModule,
  ...extModules,
);

// providers from third party dependencies
const thirdPartyProviders = [
  provideCharts(withDefaultRegisterables()),
  provideNamedApollo(() => {
    const httpLink = inject(HttpLink);
    return {
      default: {
        link: httpLink.create({uri: environment.apiUrl + '/hyperion'}),
        cache: new InMemoryCache(),
      },
      news: {
        link: httpLink.create({uri: environment.apiUrl + '/news/graphql'}),
        cache: new InMemoryCache(),
      }
    };
  }),
];

// application specific providers
const appProviders = [
  {
    provide: LOCALE_ID,
    deps: [LocaleService],
    useFactory: (localeService: LocaleService): string => localeService.currentLocale,
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  },
  {
    provide: ErrorHandler,
    useClass: ErrorHandlerService
  },
  {
    provide: LOGGER,
    useClass: ConsoleLogger,
    multi: true
  },
  {
    provide: LOGGER,
    useClass: RemoteLogger,
    multi: true
  },
  {
    provide: ERROR_HANDLER,
    useClass: HttpErrorHandler,
    multi: true
  },
  {
    provide: ERROR_HANDLER,
    useClass: LogErrorHandler,
    multi: true
  },
  {
    provide: ERROR_HANDLER,
    useClass: GraphQlErrorHandlerService,
    multi: true
  },
  {
    provide: NOTIFICATIONS_PROVIDER,
    useClass: FeedbackNotificationsProvider,
    multi: true
  },
  {
    provide: NOTIFICATIONS_PROVIDER,
    useClass: PushNotificationsProvider,
    multi: true
  },
  {
    provide: NOTIFICATIONS_PROVIDER,
    useClass: ApplicationReleaseNotificationProvider,
    multi: true
  },
  {
    provide: Window, useValue: window
  },
  ...APP_HOOKS,
];

export const appConfig: ApplicationConfig = {
  providers: [
    ...coreProviders,
    moduleProviders,
    ...thirdPartyProviders,
    ...appProviders,
    ...extProvides,
  ]
};
