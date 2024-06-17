import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import {
  NewMessageRequest,
  ReplyResponse
} from "../models/messages-http.model";
import {
  Observable,
  switchMap,
  take
} from "rxjs";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { map } from "rxjs/operators";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { DashboardContextService } from "../../../shared/services/dashboard-context.service";

interface PostMessageResponse {
  answer: string;
}

interface TerminalContext {
  tradingTerminal: string;
  portfolio: string;
  instruments: string[];
  openWidgets: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private readonly baseUrl = `${this.environmentService.apiUrl}/aichat`;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly environmentService: EnvironmentService,
    private readonly dashboardContextService: DashboardContextService
  ) {

  }

  sendMessage(message: NewMessageRequest): Observable<ReplyResponse | null> {
    return this.getTerminalContext().pipe(
      switchMap(terminalContext => {
        return this.httpClient.post<PostMessageResponse>(
          `${this.baseUrl}/messages`,
          {
            threadId: 0,
            sender: 'astras-ai-chart@mock.com',
            text: message.text,
            meta: terminalContext
          }
        );
      }),
      catchHttpError<PostMessageResponse | null>(null, this.errorHandlerService),
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
    return this.dashboardContextService.selectedDashboard$.pipe(
      take(1),
      map(d => {
        const selectedInstruments = new Set<string>();
        if (d.instrumentsSelection != null) {
          Object.values(d.instrumentsSelection).forEach(i => {
            selectedInstruments.add(i.symbol);
          });
        }

        const widgets = new Set<string>();
        d.items.forEach(w => {
          widgets.add(w.widgetType);
        });

        return {
          tradingTerminal: 'Astras',
          portfolio: d.selectedPortfolio?.portfolio ?? '',
          instruments: [...selectedInstruments.values()],
          openWidgets: [...widgets.values()]
        };
      })
    );
  }
}
