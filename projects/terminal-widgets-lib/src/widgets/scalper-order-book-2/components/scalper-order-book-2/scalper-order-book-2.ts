import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  BehaviorSubject,
  distinctUntilChanged,
  Observable,
  shareReplay
} from 'rxjs';
import {map} from 'rxjs/operators';
import {LetDirective} from '@ngrx/component';
import {AsyncPipe} from '@angular/common';
import {ScalperOrderBookDataProvider} from '@terminal-widgets-lib/widgets/scalper-order-book/services/scalper-order-book-data-provider.service';
import {ScalperCommandProcessorService} from '@terminal-widgets-lib/widgets/scalper-order-book/services/scalper-command-processor.service';
import {CancelOrdersCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/cancel-orders-command';
import {ClosePositionByMarketCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/close-position-by-market-command';
import {SubmitMarketOrderCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/submit-market-order-command';
import {ReversePositionByMarketCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/reverse-position-by-market-command';
import {SubmitStopLimitOrderCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/submit-stop-limit-order-command';
import {SetStopLossCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/set-stop-loss-command';
import {SubmitLimitOrderCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/submit-limit-order-command';
import {SubmitBestPriceOrderCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/submit-best-price-order-command';
import {GetBestOfferCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/get-best-offer-command';
import {UpdateOrdersCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/update-orders-command';
import {CurrentPositionPanel} from '@terminal-widgets-lib/widgets/scalper-order-book/components/current-position-panel/current-position-panel';
import {
  ScalperOrderBookSharedContext,
  SCALPER_ORDERBOOK_SHARED_CONTEXT
} from '@terminal-widgets-lib/widgets/scalper-order-book/components/scalper-order-book/scalper-order-book';
import {ScalperOrderBook2Body} from '@terminal-widgets-lib/widgets/scalper-order-book-2/components/scalper-order-book-2-body/scalper-order-book-2-body';

/**
 * Корневой компонент виджета scalper-orderbook-2.
 * Предоставляет общий контекст (рабочий объем, масштаб, параметры сетки)
 * и торговые команды дочерним компонентам. Команды и контекст переиспользуются
 * из scalper-order-book, поэтому панели первого виджета работают без изменений.
 */
@Component({
  selector: 'ats-scalper-order-book-2',
  templateUrl: './scalper-order-book-2.html',
  styleUrls: ['./scalper-order-book-2.less'],
  providers: [
    {
      provide: SCALPER_ORDERBOOK_SHARED_CONTEXT,
      useExisting: ScalperOrderBook2
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
    ScalperOrderBook2Body,
    CurrentPositionPanel,
    AsyncPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ScalperOrderBook2 implements ScalperOrderBookSharedContext, OnInit, OnDestroy {
  readonly guid = input.required<string>();

  readonly isActive = input(false);

  readonly workingVolume$ = new BehaviorSubject<number>(1);

  readonly scaleFactor$ = new BehaviorSubject<number>(1);

  gridSettings$!: Observable<{ rowHeight: number, fontSize: number }>;

  hideTooltips$!: Observable<boolean>;

  private readonly dataContextService = inject(ScalperOrderBookDataProvider);

  setScaleFactor(value: number): void {
    this.scaleFactor$.next(value);
  }

  setWorkingVolume(value: number): void {
    this.workingVolume$.next(value);
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

    this.hideTooltips$ = settings$.pipe(
      map(s => s.hideTooltips ?? false)
    );
  }

  ngOnDestroy(): void {
    this.workingVolume$.complete();
    this.scaleFactor$.complete();
  }
}
