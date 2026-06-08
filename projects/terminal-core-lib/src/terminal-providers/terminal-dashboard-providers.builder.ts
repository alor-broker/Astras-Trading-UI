import {
  inject,
  Provider
} from '@angular/core';
import {InMemoryCache} from '@apollo/client';
import {HttpLink} from 'apollo-angular/http';
import {provideNamedApollo} from 'apollo-angular';
import {
  provideCharts,
  withDefaultRegisterables
} from 'ng2-charts';
import {NzModalService} from 'ng-zorro-antd/modal';
import {MarkdownModule} from 'ngx-markdown';
import {AccountService} from '@terminal-core-lib/features/client-info/services/account-service';
import {AllPositionsService} from '@terminal-core-lib/features/client-info/services/all-positions.service';
import {provideFeedback} from '@terminal-core-lib/features/feedback/feedback.providers';
import {provideGraphQl} from '@terminal-core-lib/features/graphql/graph-ql.providers';
import {provideHeaderNotifications} from '@terminal-core-lib/features/header-notifications/services/header-notifications.providers';
import {NewsService} from '@terminal-core-lib/features/news/services/news.service';
import {ApplicationReleaseNotificationProvider} from '@terminal-core-lib/features/app-releases/services/application-release-notification-provider';
import {provideSessionTrack} from '@terminal-core-lib/features/session-track/session-track.providers';
import {SideNotificationsService} from '@terminal-core-lib/features/side-notifications/services/side-notifications.service';

export type TerminalDashboardProvider = Provider | Provider[];

export interface TerminalDashboardGraphQlEndpoints {
  defaultPath: string;
  newsPath: string;
}

export interface TerminalDashboardProvidersOptions {
  apiUrl: string;
  graphQlEndpoints?: Partial<TerminalDashboardGraphQlEndpoints>;
}

const defaultGraphQlEndpoints: TerminalDashboardGraphQlEndpoints = {
  defaultPath: '/hyperion',
  newsPath: '/news/graphql'
};

export class TerminalDashboardProvidersBuilder {
  private readonly providers: Provider[] = [];

  private readonly graphQlEndpoints: TerminalDashboardGraphQlEndpoints;

  constructor(private readonly options: TerminalDashboardProvidersOptions) {
    this.graphQlEndpoints = {
      ...defaultGraphQlEndpoints,
      ...options.graphQlEndpoints
    };
  }

  withProvider(...providers: TerminalDashboardProvider[]): this {
    for (const provider of providers) {
      if (Array.isArray(provider)) {
        this.providers.push(...provider);
      } else {
        this.providers.push(provider);
      }
    }

    return this;
  }

  build(): Provider[] {
    return [
      provideGraphQl(),
      AllPositionsService,
      AccountService,
      SideNotificationsService,
      NewsService,
      provideSessionTrack(),
      provideFeedback(),
      ...this.getThirdPartyProviders(),
      ...provideHeaderNotifications([
        ApplicationReleaseNotificationProvider
      ]),
      ...this.providers
    ];
  }

  private getThirdPartyProviders(): Provider[] {
    return [
      provideCharts(withDefaultRegisterables()),
      provideNamedApollo(() => {
        const httpLink = inject(HttpLink);

        return {
          default: {
            link: httpLink.create({uri: this.options.apiUrl + this.graphQlEndpoints.defaultPath}),
            cache: new InMemoryCache(),
          },
          news: {
            link: httpLink.create({uri: this.options.apiUrl + this.graphQlEndpoints.newsPath}),
            cache: new InMemoryCache(),
          }
        };
      }),
      NzModalService,
      MarkdownModule.forRoot().providers ?? [],
    ];
  }
}
