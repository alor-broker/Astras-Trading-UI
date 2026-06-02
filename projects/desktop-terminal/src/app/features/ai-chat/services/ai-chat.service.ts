import {
  HttpClient,
  HttpErrorResponse
} from "@angular/common/http";
import {
  inject,
  Injectable
} from '@angular/core';
import {ApplicationErrorHandler} from '@terminal-core-lib/features/errors-handler/errors-handler.types';
import {
  combineLatest,
  map,
  Observable,
  switchMap,
  take
} from "rxjs";
import {formatISO} from 'date-fns';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {EnvironmentService} from '../../../services/environment.service';
import {TerminalSettingsService} from '@terminal-core-lib/features/terminal-settings/services/terminal-settings.service';
import {DesktopDashboardContextService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-dashboard-context.service';
import {LoggerService} from "@terminal-core-lib/features/logging/services/logger-service";
import {
  NewMessageRequest,
  ReplyResponse
} from './ai-chat-service.types';
import {GuidGenerator} from '@terminal-core-lib/common/utils/guid-generator';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';

interface PostMessageResponse {
  answer: string;
}

interface TerminalContext {
  tradingTerminal: string;
  portfolio: string;
  instruments: string[];
  openWidgets: string[];
  currentDate: string;
}

@Injectable()
export class AiChatService {
  private readonly httpClient = inject(HttpClient);

  private readonly environmentService = inject(EnvironmentService);

  private readonly dashboardContextService = inject(DesktopDashboardContextService);

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly loggerService = inject(LoggerService);

  private readonly baseUrl = `${this.environmentService.apiUrl}/aichat`;

  sendMessage(message: NewMessageRequest): Observable<ReplyResponse | null> {
    return this.getTerminalContext().pipe(
      switchMap(terminalContext => {
        return this.httpClient.post<PostMessageResponse>(
          `${this.baseUrl}/messages`,
          {
            threadId: message.threadId,
            sender: 'astras-ai-chart@mock.com',
            text: message.text,
            meta: terminalContext,
            messageGuid: GuidGenerator.newGuid(),
            collectionName: "Astras"
          }
        );
      }),
      catchHttpError<PostMessageResponse | null>(null, this.getErrorHandler()),
      map(r => {
        if (!r) {
          return null;
        }

        return {
          text: r.answer
        } as ReplyResponse;
      }),
      take(1)
    );
  }

  private getTerminalContext(): Observable<TerminalContext> {
    return combineLatest({
      selectedDashboard: this.dashboardContextService.selectedDashboard$,
      terminalSettings: this.terminalSettingsService.getSettings()
    }).pipe(
      map(x => {
        const selectedInstruments = new Set<string>();

        if (x.selectedDashboard.instrumentsSelection != null) {
          if (x.terminalSettings.badgesBind ?? false) {
            Object.values(x.selectedDashboard.instrumentsSelection).forEach(i => {
              selectedInstruments.add(i.symbol);
            });
          } else {
            const selectedInstrument = x.selectedDashboard.instrumentsSelection[DefaultBadge];
            if (selectedInstrument != null) {
              selectedInstruments.add(selectedInstrument.symbol);
            }
          }
        }

        const widgets = new Set<string>();
        x.selectedDashboard.items.forEach(w => {
          widgets.add(w.widgetType);
        });

        return {
          tradingTerminal: 'Astras',
          portfolio: x.selectedDashboard.selectedPortfolio?.portfolio ?? '',
          instruments: [...selectedInstruments.values()],
          openWidgets: [...widgets.values()],
          // Use ISO format to send info about user timezone
          currentDate: formatISO(new Date())
        };
      }),
      take(1)
    );
  }

  private getErrorHandler(): ApplicationErrorHandler {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return {
      handleError(error: Error | HttpErrorResponse): void {
        self.loggerService.error('AI chat API error.', error);
      }
    };
  }
}
