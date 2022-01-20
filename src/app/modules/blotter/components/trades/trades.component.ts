import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { filter, map, mergeMap, switchMap } from 'rxjs/operators';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { TradeFilter } from '../../models/trade-filter.model';
import { Trade } from '../../models/trade.model';
import { BlotterService } from '../../services/blotter.service';
@Component({
  selector: 'ats-trades',
  templateUrl: './trades.component.html',
  styleUrls: ['./trades.component.sass']
})
export class TradesComponent implements OnInit {

  @Input()
  shouldShowSettings!: boolean;
  @Input()
  widget!: Widget<BlotterSettings>;
  @Input('settings') set settings(settings: BlotterSettings) { this.settings$.next(settings); };
  private settings$ = new BehaviorSubject<BlotterSettings | null>(null);
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  private trades$: Observable<Trade[]> = of([]);
  displayTrades$: Observable<Trade[]> = of([]);
  maxVolume: number = 1;
  searchFilter = new BehaviorSubject<TradeFilter>({
    idMenuVisible: false,
    symbolMenuVisible: false
  });
  constructor(private service: BlotterService) { }

  ngOnInit(): void {    
    this.trades$ = this.service.getTrades();
    this.displayTrades$ = this.trades$.pipe(
      mergeMap(trades => this.searchFilter.pipe(
        map(f => trades.filter(t => this.justifyFilter(t, f)))
      )),
    )
  }

  reset(): void {
    this.searchFilter.next({
      idMenuVisible: false,
      symbolMenuVisible: false
    });
  }

  filterChange(text: string, option: 'symbol' ) {
    const newFilter = this.searchFilter.getValue();
    newFilter[option] = text;
    this.searchFilter.next(newFilter)
  }

  getFilter() {
    return this.searchFilter.getValue();
  }

  private justifyFilter(trade: Trade, filter: TradeFilter) : boolean {
    if (filter.symbol) {
      return trade.symbol.toLowerCase().includes(filter.symbol.toLowerCase());
    }
    return true;
  }

}
