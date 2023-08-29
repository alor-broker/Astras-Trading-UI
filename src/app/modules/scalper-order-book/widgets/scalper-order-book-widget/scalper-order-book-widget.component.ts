import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import {
  Observable
} from 'rxjs';
import {
  ClusterTimeframe,
  PriceUnits,
  ScalperOrderBookSettings,
  VolumeHighlightMode
} from '../../models/scalper-order-book-settings.model';
import { NumberDisplayFormat } from '../../../../shared/models/enums/number-display-format';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";

@Component({
  selector: 'ats-scalper-order-book-widget',
  templateUrl: './scalper-order-book-widget.component.html',
  styleUrls: ['./scalper-order-book-widget.component.less']
})
export class ScalperOrderBookWidgetComponent implements OnInit {
  shouldShowSettings: boolean = false;

  @Input({required: true})
  widgetInstance!: WidgetInstance;
  @Input({required: true})
  isBlockWidget!: boolean;

  @Input()
  isActive: boolean = false;

  settings$!: Observable<ScalperOrderBookSettings>;
  showBadge$!: Observable<boolean>;
  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  onSettingsChange() {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<ScalperOrderBookSettings>(
      this.widgetInstance,
      'ScalperOrderBookSettings',
      settings => ({
        ...settings,
        title: `Скальперский стакан`,
        titleIcon: 'ordered-list',
        depth: 10,
        showZeroVolumeItems: true,
        showSpreadItems: true,
        volumeHighlightMode: VolumeHighlightMode.BiggestVolume,
        volumeHighlightFullness: 10000,
        volumeHighlightOptions: [
          { boundary: 1000, color: '#71DB20' },
          { boundary: 5000, color: '#ff0000' },
          { boundary: 10000, color: '#ff00ff' }
        ],
        workingVolumes: [1, 10, 100, 1000],
        disableHotkeys: true,
        enableMouseClickSilentOrders: false,
        autoAlignIntervalSec: 15,
        enableAutoAlign: true,
        showTradesPanel: true,
        showTradesClustersPanel: true,
        tradesClusterPanelSettings: {
          timeframe: ClusterTimeframe.M1,
          displayIntervalsCount: 5,
          volumeDisplayFormat: NumberDisplayFormat.LetterSuffix
        },
        volumeDisplayFormat: NumberDisplayFormat.Default,
        showRuler: true,
        rulerSettings: {
          markerDisplayFormat: PriceUnits.Points
        },
        showPriceWithZeroPadding: true
      }),
      this.dashboardContextService,
      this.widgetSettingsService,
    );

    this.settings$ = this.widgetSettingsService.getSettings<ScalperOrderBookSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
