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
  ScalperOrderBookWidgetSettings,
  VolumeHighlightMode
} from '../../models/scalper-order-book-settings.model';
import { NumberDisplayFormat } from '../../../../shared/models/enums/number-display-format';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { getValueOrDefault } from "../../../../shared/utils/object-helper";

@Component({
  selector: 'ats-scalper-order-book-widget',
  templateUrl: './scalper-order-book-widget.component.html',
  styleUrls: ['./scalper-order-book-widget.component.less']
})
export class ScalperOrderBookWidgetComponent implements OnInit {
  shouldShowSettings = false;

  @Input({required: true})
  widgetInstance!: WidgetInstance;
  @Input({required: true})
  isBlockWidget!: boolean;

  @Input()
  isActive = false;

  settings$!: Observable<ScalperOrderBookWidgetSettings>;
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

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<ScalperOrderBookWidgetSettings>(
      this.widgetInstance,
      'ScalperOrderBookSettings',
      settings => ({
        ...settings,
        depth: getValueOrDefault(settings.depth, 10),
        showZeroVolumeItems: getValueOrDefault(settings.showZeroVolumeItems, true),
        showSpreadItems: getValueOrDefault(settings.showSpreadItems, true),
        volumeHighlightMode: getValueOrDefault(settings.volumeHighlightMode, VolumeHighlightMode.BiggestVolume),
        volumeHighlightFullness: getValueOrDefault(settings.volumeHighlightFullness, 10000),
        volumeHighlightOptions: getValueOrDefault(
          settings.volumeHighlightOptions,
          [
            { boundary: 1000, color: '#71DB20' },
            { boundary: 5000, color: '#ff0000' },
            { boundary: 10000, color: '#ff00ff' }
          ]
          ),
        workingVolumes: getValueOrDefault(settings.workingVolumes, [1, 10, 100, 1000]),
        disableHotkeys: getValueOrDefault(settings.disableHotkeys, true),
        enableMouseClickSilentOrders: getValueOrDefault(settings.enableMouseClickSilentOrders, false),
        enableAutoAlign: getValueOrDefault(settings.enableAutoAlign, true),
        autoAlignIntervalSec: getValueOrDefault(settings.autoAlignIntervalSec, 15),
        showTradesPanel: getValueOrDefault(settings.showTradesPanel, true),
        showTradesClustersPanel: getValueOrDefault(settings.showTradesClustersPanel, true),
        tradesClusterPanelSettings: getValueOrDefault(
          settings.tradesClusterPanelSettings,
          {
            timeframe: ClusterTimeframe.M1,
            displayIntervalsCount: 5,
            volumeDisplayFormat: NumberDisplayFormat.LetterSuffix
          }
        ),
        volumeDisplayFormat: getValueOrDefault(settings.volumeDisplayFormat, NumberDisplayFormat.Default),
        showRuler: getValueOrDefault(settings.showRuler, true),
        rulerSettings: getValueOrDefault(
          settings.rulerSettings,
          {
            markerDisplayFormat: PriceUnits.Points
          }
        ),
        showPriceWithZeroPadding: getValueOrDefault(settings.showPriceWithZeroPadding, true),
      }),
      this.dashboardContextService,
      this.widgetSettingsService,
    );

    this.settings$ = this.widgetSettingsService.getSettings<ScalperOrderBookWidgetSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
