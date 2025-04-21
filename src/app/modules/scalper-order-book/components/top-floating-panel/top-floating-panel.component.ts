import {
  Component,
  Inject,
  Input,
  OnInit,
  SkipSelf
} from '@angular/core';
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

@Component({
    selector: 'ats-top-floating-panel',
    templateUrl: './top-floating-panel.component.html',
    styleUrls: ['./top-floating-panel.component.less'],
    standalone: false
})
export class TopFloatingPanelComponent implements OnInit {
  @Input({ required: true })
  guid!: string;

  @Input()
  hideTooltips = false;

  settings$!: Observable<ScalperOrderBookWidgetSettings>;
  priceDayChangePercent$!: Observable<number>;
  currentScaleFactor$!: Observable<number | null>;

  constructor(
    private readonly dataContextService: ScalperOrderBookDataProvider,
    private readonly quotesService: QuotesService,
    @Inject(SCALPER_ORDERBOOK_SHARED_CONTEXT)
    @SkipSelf()
    private readonly scalperOrderBookSharedContext: ScalperOrderBookSharedContext,
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.dataContextService.getSettingsStream(this.guid).pipe(
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
