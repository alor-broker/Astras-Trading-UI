import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NzTabChangeEvent } from 'ng-zorro-antd/tabs';
import {
  Observable,
  of
} from 'rxjs';
import {
  filter,
  map
} from 'rxjs/operators';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { BlotterService } from '../../services/blotter.service';
import { QuotesService } from '../../../../shared/services/quotes.service';
import {
  MarketType,
  PortfolioKey
} from "../../../../shared/models/portfolio-key.model";
import { Store } from "@ngrx/store";
import { getSelectedPortfolio } from "../../../../store/portfolios/portfolios.selectors";

@Component({
  selector: 'ats-blotter-widget[shouldShowSettings][guid][linkedToActive][resize]',
  templateUrl: './blotter-widget.component.html',
  styleUrls: ['./blotter-widget.component.less'],
  providers: [
    QuotesService,
    BlotterService
  ]
})
export class BlotterWidgetComponent implements OnInit {
  readonly marketTypes = MarketType;
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  set linkedToActive(linkedToActive: boolean) {
    this.service.setLinked(linkedToActive);
  }
  @Input()
  guid!: string;
  @Input()
  resize!: EventEmitter<DashboardItem>;

  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  activeTabIndex$ = of(0);

  marketType$?: Observable<MarketType | undefined>;

  constructor(private readonly service: BlotterService, private readonly store: Store) { }

  ngOnInit(): void {
    this.activeTabIndex$ = this.service.getSettings(this.guid).pipe(
      map(s => s.activeTabIndex)
    );

    this.marketType$ = this.store.select(getSelectedPortfolio).pipe(
      filter((p): p is PortfolioKey => !!p),
      map(p => p.marketType)
    );
  }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }

  onIndexChange(event: NzTabChangeEvent) {
    this.service.setTabIndex(event.index ?? 0);
  }
}
