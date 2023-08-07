import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import { Observable } from 'rxjs';
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import { OrderSubmitSettings } from '../../models/order-submit-settings.model';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";

@Component({
  selector: 'ats-order-submit-widget',
  templateUrl: './order-submit-widget.component.html',
  styleUrls: ['./order-submit-widget.component.less']
})
export class OrderSubmitWidgetComponent implements OnInit {
  shouldShowSettings: boolean = false;

  @Input({required: true})
  widgetInstance!: WidgetInstance;
  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<OrderSubmitSettings>;
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
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<OrderSubmitSettings>(
      this.widgetInstance,
      'OrderSubmitSettings',
      settings => ({
        ...settings,
        enableLimitOrdersFastEditing: false,
        limitOrderPriceMoveSteps: [1, 2, 5, 10],
        showVolumePanel: false,
        workingVolumes: [1, 5, 10, 20, 30, 40, 50, 100, 200]
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<OrderSubmitSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
