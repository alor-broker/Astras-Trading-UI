import {
  Component,
  inject,
  input,
  OnInit
} from '@angular/core';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {Observable} from "rxjs";
import {WidgetSettingsCreationHelper} from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {getValueOrDefault} from "../../../../shared/utils/object-helper";
import {TableSettingHelper} from "../../../../shared/utils/table-setting.helper";
import {
  AdminClientPositionsSettings,
  AdminClientPositionsTableColumns
} from "../../models/admin-client-positions-settings.model";
import {AsyncPipe} from "@angular/common";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {AdminClientPositionsComponent} from "../../components/admin-client-positions/admin-client-positions.component";
import {AdminClientPositionsSettingsComponent} from "../../components/admin-client-positions-settings/admin-client-positions-settings.component";

@Component({
  selector: 'ats-admin-client-positions-widget',
  imports: [
    AsyncPipe,
    WidgetHeaderComponent,
    WidgetSkeletonComponent,
    AdminClientPositionsComponent,
    AdminClientPositionsSettingsComponent
  ],
  templateUrl: './admin-client-positions-widget.component.html',
  styleUrl: './admin-client-positions-widget.component.less',
})
export class AdminClientPositionsWidgetComponent implements OnInit {
  shouldShowSettings = false;

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<AdminClientPositionsSettings>;

  private readonly widgetSettingsService = inject(WidgetSettingsService);

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<AdminClientPositionsSettings>(
      this.widgetInstance(),
      'AdminClientPositionsSettings',
      settings => ({
        ...settings,
        refreshIntervalSec: getValueOrDefault(settings.refreshIntervalSec, 60),
        table: TableSettingHelper.toTableDisplaySettings(
          settings.table,
          AdminClientPositionsTableColumns.filter(c => c.isDefault).map(c => c.id)
        )!
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<AdminClientPositionsSettings>(this.guid);
  }
}
