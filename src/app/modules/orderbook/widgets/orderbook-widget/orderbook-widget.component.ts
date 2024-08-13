import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { OrderbookService } from '../../services/orderbook.service';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { Observable } from 'rxjs';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import {
  ColumnsOrder,
  OrderbookSettings
} from '../../models/orderbook-settings.model';
import { NumberDisplayFormat } from '../../../../shared/models/enums/number-display-format';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { getValueOrDefault } from "../../../../shared/utils/object-helper";

@Component({
  selector: 'ats-orderbook-widget',
  templateUrl: './orderbook-widget.component.html',
  styleUrls: ['./orderbook-widget.component.less'],
  providers: [OrderbookService]
})
export class OrderbookWidgetComponent implements OnInit {
  shouldShowSettings = false;

  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<OrderbookSettings>;
  showBadge$!: Observable<boolean>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<OrderbookSettings>(
      this.widgetInstance,
      'OrderbookSettings',
      settings => ({
        ...settings,
        depth: getValueOrDefault(settings.depth, 17),
        showChart: getValueOrDefault(settings.showChart, true),
        showTable: getValueOrDefault(settings.showTable, true),
        showYieldForBonds: getValueOrDefault(settings.showYieldForBonds, false),
        useOrderWidget: getValueOrDefault(settings.useOrderWidget, false),
        showVolume: getValueOrDefault(settings.showVolume, false),
        columnsOrder: getValueOrDefault(settings.columnsOrder, ColumnsOrder.VolumesAtTheEdges),
        volumeDisplayFormat: getValueOrDefault(settings.volumeDisplayFormat, NumberDisplayFormat.Default),
        showPriceWithZeroPadding: getValueOrDefault(settings.showPriceWithZeroPadding, true),
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<OrderbookSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
