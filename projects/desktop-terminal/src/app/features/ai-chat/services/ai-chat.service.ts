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
  AiChatErrorCode,
  MessageErrorResponse,
  NewMessageRequest,
  ReplyResponse
} from './ai-chat-service.types';
import {GuidGenerator} from '@terminal-core-lib/common/utils/guid-generator';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';

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

  private readonly translatorService = inject(TranslatorService);

  private readonly baseUrl = `${this.environmentService.apiUrl}/aichat`;

  // null represents an HTTP error without a dedicated user-facing message.
  sendMessage(message: NewMessageRequest): Observable<ReplyResponse | MessageErrorResponse | null> {
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
          },
          {
            headers: {
              'X-Response-Language': this.translatorService.getActiveLang()
            }
          }
        );
      }),
      map((r): ReplyResponse => ({text: r.answer})),
      catchHttpError<ReplyResponse | MessageErrorResponse | null>(
        error => this.getMessageError(error),
        this.getErrorHandler()
      ),
      take(1)
    );
  }

  private getMessageError(error: HttpErrorResponse): MessageErrorResponse | null {
    const body: unknown = error.error;
    if (typeof body !== 'object' || body === null || !('code' in body)) {
      return null;
    }

    if (body.code === AiChatErrorCode.ContextTooLarge || body.code === AiChatErrorCode.ContextCompactionFailed) {
      return {errorCode: body.code};
    }

    return null;
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
          exchange: x.selectedDashboard.selectedPortfolio?.exchange ?? '',
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
