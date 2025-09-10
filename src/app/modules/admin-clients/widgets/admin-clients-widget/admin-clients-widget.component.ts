import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { WidgetInstance } from "../../../../shared/models/dashboard/dashboard-item.model";
import { Observable } from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {
  AdminClientsSettings,
  AdminClientsTableColumns
} from "../../models/admin-clients-settings.model";
import { TranslocoDirective } from "@jsverse/transloco";
import { SharedModule } from "../../../../shared/shared.module";
import { AdminClientsComponent } from "../../components/admin-clients/admin-clients.component";
import { getValueOrDefault } from "../../../../shared/utils/object-helper";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";

@Component({
  selector: 'ats-admin-clients-widget',
  standalone: true,
  imports: [
    TranslocoDirective,
    SharedModule,
    AdminClientsComponent
  ],
  templateUrl: './admin-clients-widget.component.html',
  styleUrl: './admin-clients-widget.component.less'
})
export class AdminClientsWidgetComponent implements OnInit {
  shouldShowSettings = false;

  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<AdminClientsSettings>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<AdminClientsSettings>(
      this.widgetInstance,
      'AdminClientsSettings',
      settings => ({
        ...settings,
        refreshIntervalSec: getValueOrDefault(settings.refreshIntervalSec, 60),
        table: TableSettingHelper.toTableDisplaySettings(
          settings.table,
          AdminClientsTableColumns.filter(c => c.isDefault).map(c => c.id)
        )!
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<AdminClientsSettings>(this.guid);
  }
}
