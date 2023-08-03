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
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import {
  ColumnsOrder,
  OrderbookSettings
} from '../../models/orderbook-settings.model';
import { NumberDisplayFormat } from '../../../../shared/models/enums/number-display-format';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";

@Component({
  selector: 'ats-orderbook-widget',
  templateUrl: './orderbook-widget.component.html',
  styleUrls: ['./orderbook-widget.component.less'],
  providers: [OrderbookService]
})
export class OrderbookWidgetComponent implements OnInit {
  shouldShowSettings: boolean = false;

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

  onSettingsChange() {
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
        depth: 17,
        showChart: true,
        showTable: true,
        showYieldForBonds: false,
        useOrderWidget: false,
        showVolume: false,
        columnsOrder: ColumnsOrder.volumesAtTheEdges,
        volumeDisplayFormat: NumberDisplayFormat.Default,
        showPriceWithZeroPadding: true
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<OrderbookSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
