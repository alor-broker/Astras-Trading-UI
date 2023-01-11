import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { NzTabChangeEvent } from 'ng-zorro-antd/tabs';
import {
  Observable,
  of,
  shareReplay,
  Subject,
  take,
  takeUntil
} from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DashboardItem,
  DashboardItemContentSize
} from 'src/app/shared/models/dashboard-item.model';
import { BlotterService } from '../../services/blotter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterSettings } from "../../../../shared/models/settings/blotter-settings.model";
import { MarketType } from "../../../../shared/models/portfolio-key.model";

@Component({
  selector: 'ats-blotter-widget[shouldShowSettings][guid][resize]',
  templateUrl: './blotter-widget.component.html',
  styleUrls: ['./blotter-widget.component.less'],
  providers: [
    BlotterService
  ]
})
export class BlotterWidgetComponent implements OnInit, OnDestroy {
  readonly marketTypes = MarketType;
  private settings$!: Observable<BlotterSettings>;
  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

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

  constructor(private readonly settingsService: WidgetSettingsService) {
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<BlotterSettings>(this.guid)
      .pipe(
        takeUntil(this.destroy$)
      );

    this.activeTabIndex$ = this.settings$.pipe(
      map(s => s.activeTabIndex),
      take(1)
    );

    this.marketType$ = this.settings$
      .pipe(
        map(s => s.marketType)
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

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
