import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, switchMap, take, tap, throwError } from 'rxjs';
import { Side } from 'src/app/shared/models/enums/side.model';
import { LimitCommand } from '../models/limit-command.model';
import { LimitEdit } from '../models/limit-edit.model';
import { MarketCommand } from '../models/market-command.model';
import { StopCommand } from '../models/stop-command.model';
import { SubmitOrderResult } from "../models/order.model";
import { OrderService } from "../../../shared/services/orders/order.service";
import { StopEdit } from "../models/stop-edit";

@Injectable({
  providedIn: 'root'
})
export class CommandsService {
  private stopCommand?: BehaviorSubject<StopCommand | null>;
  private limitCommand?: BehaviorSubject<LimitCommand | null>;
  private limitEdit?: BehaviorSubject<LimitEdit | null>;
  private stopEdit?: BehaviorSubject<StopEdit | null>;
  private marketCommand?: BehaviorSubject<MarketCommand | null>;
  private commandErrorSubject$ = new Subject<boolean | null>();
  public commandError$ = this.commandErrorSubject$.asObservable();


  constructor(private readonly orderService: OrderService) {
  }

  setStopCommand(command: StopCommand | null) {
    if (!this.stopCommand) {
      this.stopCommand = new BehaviorSubject<StopCommand | null>(command);
    }
    this.stopCommand?.next(command);
  }

  getStopCommand(): Observable<StopCommand | null> {
    if (!this.stopCommand) {
      this.stopCommand = new BehaviorSubject<StopCommand | null>(null);
    }
    return this.stopCommand.asObservable();
  }

  setLimitCommand(command: LimitCommand | null) {
    if (!this.limitCommand) {
      this.limitCommand = new BehaviorSubject<LimitCommand | null>(command);
    }
    this.limitCommand?.next(command);
  }

  getLimitCommand(): Observable<LimitCommand | null> {
    if (!this.limitCommand) {
      this.limitCommand = new BehaviorSubject<LimitCommand | null>(null);
    }
    return this.limitCommand.asObservable();
  }

  setMarketCommand(command: MarketCommand | null) {
    if (!this.marketCommand) {
      this.marketCommand = new BehaviorSubject<MarketCommand | null>(command);
    }
    this.marketCommand?.next(command);
  }

  getMarketCommand(): Observable<MarketCommand | null> {
    if (!this.marketCommand) {
      this.marketCommand = new BehaviorSubject<MarketCommand | null>(null);
    }
    return this.marketCommand.asObservable();
  }

  setLimitEdit(command: LimitEdit | null) {
    if (!this.limitEdit) {
      this.limitEdit = new BehaviorSubject<LimitEdit | null>(command);
    }
    this.limitEdit?.next(command);
  }

  getLimitEdit(): Observable<LimitEdit | null> {
    if (!this.limitEdit) {
      this.limitEdit = new BehaviorSubject<LimitEdit | null>(null);
    }
    return this.limitEdit.asObservable();
  }

  setStopEdit(command: StopEdit | null) {
    if (!this.stopEdit) {
      this.stopEdit = new BehaviorSubject<StopEdit | null>(command);
    }
    this.stopEdit?.next(command);
  }

  getStopEdit(): Observable<StopEdit | null> {
    if (!this.stopEdit) {
      this.stopEdit = new BehaviorSubject<StopEdit | null>(null);
    }
    return this.stopEdit.asObservable();
  }

  submitStop(side: Side): Observable<SubmitOrderResult> {
    if (!this.stopCommand) {
      return this.getEmptyCommandError();
    }

    return this.extendWithErrorCheck(
      this.stopCommand.pipe(
        take(1),
        switchMap(stopCommand => {
          if (!stopCommand) {
            return this.getEmptyCommandError();
          }

          if (stopCommand.price != null) {
            return this.orderService.submitStopLimitOrder(
              {
                ...stopCommand,
                price: stopCommand.price,
                side: side
              },
              stopCommand.user?.portfolio ?? ''
            );
          } else {
            return this.orderService.submitStopMarketOrder(
              {
                ...stopCommand,
                side: side
              },
              stopCommand.user?.portfolio ?? ''
            );
          }
        })
      )
    );
  }

  submitStopLimitEdit() {
    return this.submitStopEdit(true);
  }

  submitStopMarketEdit() {
    return this.submitStopEdit(false);
  }

  private submitStopEdit(isLimit: boolean) {
    if (!this.stopEdit) {
      return this.getEmptyCommandError();
    }

    return this.extendWithErrorCheck(
      this.stopEdit.pipe(
        take(1),
        switchMap(stopEdit => {
          if (!stopEdit) {
            return this.getEmptyCommandError();
          }

          if (isLimit) {
            return this.orderService.submitStopLimitOrderEdit(
              {
                ...stopEdit,
                conditionType: stopEdit.condition,
                endTime: stopEdit.stopEndUnixTime as number,
                side: stopEdit.side!,
                price: stopEdit.price!
              },
              stopEdit.user?.portfolio ?? ''
            );
          } else {
            return this.orderService.submitStopMarketOrderEdit(
              {
                ...stopEdit,
                conditionType: stopEdit.condition,
                endTime: stopEdit.stopEndUnixTime as number,
                side: stopEdit.side!
              },
              stopEdit.user?.portfolio ?? ''
            );
          }
        })
      )
    );
  }

  submitLimit(side: Side): Observable<SubmitOrderResult> {
    if (!this.limitCommand) {
      return this.getEmptyCommandError();
    }

    return this.extendWithErrorCheck(
      this.limitCommand.pipe(
        take(1),
        switchMap(limitCommand => {
          if (!limitCommand) {
            return this.getEmptyCommandError();
          }

          if (limitCommand.topOrderPrice || limitCommand.bottomOrderPrice) {
            return this.orderService.submitOrdersGroup({
              ...limitCommand,
              side
            },
              limitCommand.user?.portfolio ?? '');
          }

          return this.orderService.submitLimitOrder(
            {
              ...limitCommand,
              side
            },
            limitCommand.user?.portfolio ?? ''
          );
        })
      )
    );
  }

  submitMarket(side: Side): Observable<SubmitOrderResult> {
    if (!this.marketCommand) {
      return this.getEmptyCommandError();
    }

    return this.extendWithErrorCheck(
      this.marketCommand.pipe(
        take(1),
        switchMap(marketCommand => {
          if (!marketCommand) {
            return this.getEmptyCommandError();
          }

          return this.orderService.submitMarketOrder(
            {
              ...marketCommand,
              side: side
            },
            marketCommand.user?.portfolio ?? ''
          );
        })
      )
    );
  }

  submitLimitEdit(): Observable<SubmitOrderResult> {
    if (!this.limitEdit) {
      return this.getEmptyCommandError();
    }

    return this.extendWithErrorCheck(
      this.limitEdit.pipe(
        take(1),
        switchMap(limitEdit => {
          if (!limitEdit) {
            return this.getEmptyCommandError();
          }

          return this.orderService.submitLimitOrderEdit(
            { ...limitEdit },
            limitEdit.user?.portfolio ?? ''
          );
        })
      )
    );
  }

  private getEmptyCommandError(): Observable<never> {
    this.commandErrorSubject$.next(true);
    return throwError(() => new Error('Empty command'));
  }

  private extendWithErrorCheck(source: Observable<SubmitOrderResult>): Observable<SubmitOrderResult> {
    return source.pipe(
      tap(result => {
        if (!result.isSuccess) {
          this.commandErrorSubject$.next(true);
        }
      })
    );
  }
}
