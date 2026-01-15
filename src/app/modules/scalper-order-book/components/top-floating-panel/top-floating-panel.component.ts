import { Component, OnInit, input, inject } from '@angular/core';
import { QuotesService } from "../../../../shared/services/quotes.service";
import {
  distinctUntilChanged,
  Observable,
  shareReplay,
  switchMap
} from "rxjs";
import { ScalperOrderBookWidgetSettings } from "../../models/scalper-order-book-settings.model";
import { map } from "rxjs/operators";
import {
  SCALPER_ORDERBOOK_SHARED_CONTEXT,
  ScalperOrderBookSharedContext
} from "../scalper-order-book/scalper-order-book.component";
import { ScalperOrderBookDataProvider } from "../../services/scalper-order-book-data-provider.service";
import { isInstrumentEqual } from "../../../../shared/utils/settings-helper";
import { TranslocoDirective } from '@jsverse/transloco';
import { LetDirective } from '@ngrx/component';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { NgClass, AsyncPipe, DecimalPipe } from '@angular/common';

@Component({
    selector: 'ats-top-floating-panel',
    templateUrl: './top-floating-panel.component.html',
    styleUrls: ['./top-floating-panel.component.less'],
    imports: [
      TranslocoDirective,
      LetDirective,
      NzTooltipDirective,
      NgClass,
      AsyncPipe,
      DecimalPipe
    ]
})
export class TopFloatingPanelComponent implements OnInit {
  private readonly dataContextService = inject(ScalperOrderBookDataProvider);
  private readonly quotesService = inject(QuotesService);
  private readonly scalperOrderBookSharedContext = inject<ScalperOrderBookSharedContext>(SCALPER_ORDERBOOK_SHARED_CONTEXT, { skipSelf: true });

  readonly guid = input.required<string>();

  readonly hideTooltips = input(false);

  settings$!: Observable<ScalperOrderBookWidgetSettings>;
  priceDayChangePercent$!: Observable<number>;
  currentScaleFactor$!: Observable<number | null>;

  ngOnInit(): void {
    this.settings$ = this.dataContextService.getSettingsStream(this.guid()).pipe(
      map(x => x.widgetSettings),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.priceDayChangePercent$ = this.settings$.pipe(
      distinctUntilChanged((prev, curr) => isInstrumentEqual(prev, curr)),
      switchMap(s => this.quotesService.getQuotes(s.symbol, s.exchange, s.instrumentGroup)),
      map(q => q.change_percent ?? 0)
    );

    this.currentScaleFactor$ = this.scalperOrderBookSharedContext.scaleFactor$.pipe(
      map(sf => sf === 1 ? null : sf)
    );
  }
}
