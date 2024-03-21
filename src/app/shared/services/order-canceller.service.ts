import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
  tap
} from 'rxjs';
import { CancelCommand } from '../models/commands/cancel-command.model';
import { CommandResponse } from '../models/commands/command-response.model';
import { GuidGenerator } from '../utils/guid';
import { InstantNotificationsService } from './instant-notifications.service';
import { OrdersInstantNotificationType } from '../models/terminal-settings/terminal-settings.model';
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { catchHttpError, mapWith } from "../utils/observable-helper";
import { EnvironmentService } from "./environment.service";
import { filter } from "rxjs/operators";
import { TranslatorFn, TranslatorService } from "./translator.service";

@Injectable({
  providedIn: 'root'
})
export class OrderCancellerService {
  private readonly url = this.environmentService.apiUrl + '/commandapi/warptrans/TRADE/v2/client/orders';
  private readonly requestDelayMSec$ = new BehaviorSubject<number | null>(null);
  private translator$!: Observable<TranslatorFn>;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly http: HttpClient,
    private readonly instantNotificationsService: InstantNotificationsService,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly translatorService: TranslatorService
  ) {
  }

  get lastRequestDelayMSec$(): Observable<number> {
    return this.requestDelayMSec$.pipe(
      filter((x): x is number => x != null)
    );
  }

  cancelOrder(command: CancelCommand): Observable<CommandResponse | null> {
    let startTime: number;

    return of(Date.now()).pipe(
      tap(st => startTime = st),
      switchMap(() => this.http.delete<CommandResponse>(`${this.url}/${command.orderid}`, {
        params: { ...command, jsonResponse: true },
        headers: {
          'X-ALOR-REQID': GuidGenerator.newGuid()
        }
      })),
      catchHttpError<CommandResponse | null>(null, this.errorHandlerService),
      take(1),
      tap(() => {
        this.requestDelayMSec$.next(Date.now() - startTime);
      }),
      mapWith(
        () => this.getTranslatorFn(),
        (resp, t) => {
          if (resp?.orderNumber != null) {
            this.instantNotificationsService.showNotification(
              OrdersInstantNotificationType.OrderCancelled,
              'success',
              t(['orderCancelledTitle'], { fallback: 'Заявка отменена'}),
              t(
                ['orderCancelledContent'],
                {
                  fallback: `Заявка ${command.orderid} на ${command.exchange} успешно отменена`,
                  orderId: command.orderid,
                  exchange: command.exchange
                }),
            );
          }

          return resp;
        })
    );
  }

  private getTranslatorFn(): Observable<TranslatorFn> {
    if (this.translator$ == null) {
      this.translator$ = this.translatorService.getTranslator('shared/orders-notifications')
        .pipe(shareReplay(1));
    }

    return this.translator$;
  }
}
