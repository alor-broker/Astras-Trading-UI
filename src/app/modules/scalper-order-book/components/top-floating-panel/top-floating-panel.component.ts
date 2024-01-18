import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { QuotesService } from "../../../../shared/services/quotes.service";
import {
  Observable,
  shareReplay,
  switchMap
} from "rxjs";
import { ScalperOrderBookWidgetSettings } from "../../models/scalper-order-book-settings.model";
import { ScalperSettingsHelper } from "../../utils/scalper-settings.helper";
import { map } from "rxjs/operators";

@Component({
  selector: 'ats-top-floating-panel',
  templateUrl: './top-floating-panel.component.html',
  styleUrls: ['./top-floating-panel.component.less']
})
export class TopFloatingPanelComponent implements OnInit {
  @Input({ required: true })
  guid!: string;

  settings$!: Observable<ScalperOrderBookWidgetSettings>;
  priceDayChangePercent$!: Observable<number>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly quotesService: QuotesService
  ) {
  }

  ngOnInit(): void {
    this.settings$ = ScalperSettingsHelper.getSettingsStream(this.guid, this.widgetSettingsService).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.priceDayChangePercent$ = this.settings$.pipe(
      switchMap(s => this.quotesService.getQuotes(s.symbol, s.exchange, s.instrumentGroup)),
      map(q => q.change_percent)
    );
  }
}
