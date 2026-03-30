import { Component, OnInit, input, inject } from '@angular/core';
import { WidgetInstance } from "../../../../shared/models/dashboard/dashboard-item.model";
import { Observable } from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {
  AdminClientsSettings,
  AdminClientsTableColumns
} from "../../models/admin-clients-settings.model";
import { AdminClientsComponent } from "../../components/admin-clients/admin-clients.component";
import { getValueOrDefault } from "../../../../shared/utils/object-helper";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";
import { AdminClientsSettingsComponent } from "../../components/admin-clients-settings/admin-clients-settings.component";
import {AsyncPipe} from "@angular/common";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";

@Component({
  selector: 'ats-admin-clients-widget',
  standalone: true,
  imports: [
    AdminClientsComponent,
    AdminClientsSettingsComponent,
    AsyncPipe,
    WidgetSkeletonComponent,
    WidgetHeaderComponent
  ],
  templateUrl: './admin-clients-widget.component.html',
  styleUrl: './admin-clients-widget.component.less'
})
export class AdminClientsWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);

  shouldShowSettings = false;

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<AdminClientsSettings>;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<AdminClientsSettings>(
      this.widgetInstance(),
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
