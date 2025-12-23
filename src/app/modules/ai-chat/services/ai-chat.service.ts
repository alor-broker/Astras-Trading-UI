import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {
  NewMessageRequest,
  ReplyResponse,
} from "../models/messages-http.model";
import {
  combineLatest,
  Observable,
  switchMap,
  take,
} from "rxjs";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { map } from "rxjs/operators";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { DashboardContextService } from "../../../shared/services/dashboard-context.service";
import { LoggerService } from "../../../shared/services/logging/logger.service";
import { ApplicationErrorHandler } from "../../../shared/services/handle-error/error-handler";
import { TerminalSettingsService } from "../../../shared/services/terminal-settings.service";
import { defaultBadgeColor } from "../../../shared/utils/instruments";
import { GuidGenerator } from "../../../shared/utils/guid";
import { formatISO } from "date-fns";

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

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private readonly httpClient = inject(HttpClient);
  private readonly environmentService = inject(EnvironmentService);
  private readonly dashboardContextService = inject(DashboardContextService);
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
            const selectedInstrument = x.selectedDashboard.instrumentsSelection[defaultBadgeColor];
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
    const self = this;
    return {
      handleError(error: Error | HttpErrorResponse): void {
        self.loggerService.error('AI chat API error.', error);
      }
    };
  }
}
