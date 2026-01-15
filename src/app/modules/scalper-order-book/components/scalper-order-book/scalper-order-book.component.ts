import { Component, InjectionToken, OnDestroy, OnInit, input, inject } from '@angular/core';
import {
  BehaviorSubject,
  distinctUntilChanged,
  Observable,
  shareReplay
} from 'rxjs';
import { map } from "rxjs/operators";
import { ScalperOrderBookDataProvider } from "../../services/scalper-order-book-data-provider.service";
import { LetDirective } from '@ngrx/component';
import { NgStyle, AsyncPipe } from '@angular/common';
import { ScalperOrderBookBodyComponent } from '../scalper-order-book-body/scalper-order-book-body.component';
import { CurrentPositionPanelComponent } from '../current-position-panel/current-position-panel.component';
import {ScalperCommandProcessorService} from "../../services/scalper-command-processor.service";
import {CancelOrdersCommand} from "../../commands/cancel-orders-command";
import {ClosePositionByMarketCommand} from "../../commands/close-position-by-market-command";
import {SubmitMarketOrderCommand} from "../../commands/submit-market-order-command";
import {ReversePositionByMarketCommand} from "../../commands/reverse-position-by-market-command";
import {SubmitStopLimitOrderCommand} from "../../commands/submit-stop-limit-order-command";
import {SetStopLossCommand} from "../../commands/set-stop-loss-command";
import {SubmitLimitOrderCommand} from "../../commands/submit-limit-order-command";
import {SubmitBestPriceOrderCommand} from "../../commands/submit-best-price-order-command";
import {GetBestOfferCommand} from "../../commands/get-best-offer-command";
import {UpdateOrdersCommand} from "../../commands/update-orders-command";

export interface ScalperOrderBookSharedContext {
  readonly workingVolume$: Observable<number | null>;
  gridSettings$: Observable<{ rowHeight: number, fontSize: number }>;
  readonly scaleFactor$: Observable<number>;

  setWorkingVolume(value: number): void;

  setScaleFactor(value: number): void;
}

export const SCALPER_ORDERBOOK_SHARED_CONTEXT = new InjectionToken<ScalperOrderBookSharedContext>('ScalperOrderBookSharedContext');

@Component({
    selector: 'ats-scalper-order-book',
    templateUrl: './scalper-order-book.component.html',
    styleUrls: ['./scalper-order-book.component.less'],
    providers: [
        {
            provide: SCALPER_ORDERBOOK_SHARED_CONTEXT,
            useExisting: ScalperOrderBookComponent
        },
      CancelOrdersCommand,
      ClosePositionByMarketCommand,
      SubmitMarketOrderCommand,
      ReversePositionByMarketCommand,
      SubmitStopLimitOrderCommand,
      SetStopLossCommand,
      SubmitLimitOrderCommand,
      SubmitBestPriceOrderCommand,
      GetBestOfferCommand,
      UpdateOrdersCommand,
      ScalperCommandProcessorService
    ],
    imports: [
      LetDirective,
      NgStyle,
      ScalperOrderBookBodyComponent,
      CurrentPositionPanelComponent,
      AsyncPipe
    ]
})
export class ScalperOrderBookComponent implements ScalperOrderBookSharedContext, OnInit, OnDestroy {
  private readonly dataContextService = inject(ScalperOrderBookDataProvider);

  readonly guid = input.required<string>();

  readonly isActive = input(false);

  workingVolume$ = new BehaviorSubject<number>(1);
  scaleFactor$ = new BehaviorSubject<number>(1);

  gridSettings$!: Observable<{ rowHeight: number, fontSize: number }>;

  hideTooltips$!: Observable<boolean>;

  setScaleFactor(value: number): void {
    this.scaleFactor$.next(value);
  }

  ngOnInit(): void {
    const settings$ = this.dataContextService.getSettingsStream(this.guid()).pipe(
      map(s => s.widgetSettings),
      shareReplay({bufferSize: 1, refCount: true})
    );

    this.gridSettings$ = settings$.pipe(
      map(s => ({
          rowHeight: s.rowHeight ?? 18,
          fontSize: s.fontSize ?? 12
        })
      ),
      distinctUntilChanged((prev, curr) => prev.fontSize === curr.fontSize && prev.rowHeight === curr.rowHeight),
      shareReplay({bufferSize: 1, refCount: true})
    );

    this.hideTooltips$ = settings$
      .pipe(
        map(s => s.hideTooltips ?? false)
      );
  }

  setWorkingVolume(value: number): void {
    this.workingVolume$.next(value);
  }

  ngOnDestroy(): void {
    this.workingVolume$.complete();
    this.scaleFactor$.complete();
  }
}
