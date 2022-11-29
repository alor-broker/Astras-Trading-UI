import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { NzTabChangeEvent } from 'ng-zorro-antd/tabs';
import {
  Observable,
  of,
  shareReplay,
  take
} from 'rxjs';
import {
  filter,
  map
} from 'rxjs/operators';
import {
  DashboardItem,
  DashboardItemContentSize
} from 'src/app/shared/models/dashboard-item.model';
import { BlotterService } from '../../services/blotter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterSettings } from "../../../../shared/models/settings/blotter-settings.model";
import {
  MarketType,
  PortfolioKey
} from "../../../../shared/models/portfolio-key.model";
import { Store } from "@ngrx/store";
import { getSelectedPortfolioKey } from "../../../../store/portfolios/portfolios.selectors";

@Component({
  selector: 'ats-blotter-widget[shouldShowSettings][guid][resize]',
  templateUrl: './blotter-widget.component.html',
  styleUrls: ['./blotter-widget.component.less'],
  providers: [
    BlotterService
  ]
})
export class BlotterWidgetComponent implements OnInit {
  readonly marketTypes = MarketType;
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  activeTabIndex$ = of(0);

  marketType$?: Observable<MarketType | undefined>;

  contentSize$!: Observable<DashboardItemContentSize>;

  constructor(private readonly settingsService: WidgetSettingsService, private readonly store: Store) {
  }

  ngOnInit(): void {
    this.activeTabIndex$ = this.settingsService.getSettings<BlotterSettings>(this.guid).pipe(
      map(s => s.activeTabIndex),
      take(1)
    );

    this.marketType$ = this.store.select(getSelectedPortfolioKey).pipe(
      filter((p): p is PortfolioKey => !!p),
      map(p => p.marketType)
    );

    this.contentSize$ = this.resize.pipe(
      map(x => ({
        height: x.height,
        width: x.width
      } as DashboardItemContentSize)),
      shareReplay(1)
    );
  }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }

  onIndexChange(event: NzTabChangeEvent) {
    this.settingsService.updateSettings(this.guid, { activeTabIndex: event.index ?? 0 });
  }
}
