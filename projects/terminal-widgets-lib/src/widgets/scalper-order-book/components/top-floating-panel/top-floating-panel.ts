import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  distinctUntilChanged,
  Observable,
  shareReplay,
  switchMap
} from "rxjs";
import {map} from "rxjs/operators";
import {ScalperOrderBookDataProvider} from "../../services/scalper-order-book-data-provider.service";
import {TranslocoDirective} from '@jsverse/transloco';
import {LetDirective} from '@ngrx/component';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {
  AsyncPipe,
  DecimalPipe
} from '@angular/common';
import {QuotesService} from '@terminal-core-lib/features/instruments/services/quotes.service';
import {ScalperOrderBookWidgetSettings} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {InstrumentEqualityComparer} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {SCALPER_ORDERBOOK_SHARED_CONTEXT} from '@terminal-widgets-lib/widgets/scalper-order-book/components/scalper-order-book/scalper-order-book';

@Component({
  selector: 'ats-top-floating-panel',
  templateUrl: './top-floating-panel.html',
  styleUrls: ['./top-floating-panel.less'],
  imports: [
    TranslocoDirective,
    LetDirective,
    NzTooltipDirective,
    AsyncPipe,
    DecimalPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class TopFloatingPanel implements OnInit {
  readonly guid = input.required<string>();

  readonly hideTooltips = input(false);

  settings$!: Observable<ScalperOrderBookWidgetSettings>;

  priceDayChangePercent$!: Observable<number>;

  currentScaleFactor$!: Observable<number | null>;

  private readonly dataContextService = inject(ScalperOrderBookDataProvider);

  private readonly quotesService = inject(QuotesService);

  private readonly scalperOrderBookSharedContext = inject(SCALPER_ORDERBOOK_SHARED_CONTEXT, {skipSelf: true});

  ngOnInit(): void {
    this.settings$ = this.dataContextService.getSettingsStream(this.guid()).pipe(
      map(x => x.widgetSettings),
      shareReplay({bufferSize: 1, refCount: true})
    );

    this.priceDayChangePercent$ = this.settings$.pipe(
      distinctUntilChanged((prev, curr) => InstrumentEqualityComparer.equals(prev, curr)),
      switchMap(s => this.quotesService.getQuotesSubscription(s.symbol, s.exchange, s.instrumentGroup)),
      map(q => q.change_percent ?? 0)
    );

    this.currentScaleFactor$ = this.scalperOrderBookSharedContext.scaleFactor$.pipe(
      map(sf => sf === 1 ? null : sf)
    );
  }
}
