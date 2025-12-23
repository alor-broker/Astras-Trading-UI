import { Component, input, OnInit, inject } from '@angular/core';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {WidgetSettingsCreationHelper} from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import {DashboardContextService} from '../../../../shared/services/dashboard-context.service';
import {Observable} from 'rxjs';
import {SettingsHelper} from '../../../../shared/utils/settings-helper';
import {AllTradesSettings, allTradesWidgetColumns} from '../../models/all-trades-settings.model';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {getValueOrDefault} from "../../../../shared/utils/object-helper";
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeletonComponent} from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import {WidgetHeaderComponent} from '../../../../shared/components/widget-header/widget-header.component';
import {
  WidgetHeaderInstrumentSwitchComponent
} from '../../../../shared/components/widget-header-instrument-switch/widget-header-instrument-switch.component';
import {AllTradesComponent} from '../../components/all-trades/all-trades.component';
import {AllTradesSettingsComponent} from '../../components/all-trades-settings/all-trades-settings.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-all-trades-widget',
  templateUrl: './all-trades-widget.component.html',
  styleUrls: ['./all-trades-widget.component.less'],
  imports: [
    TranslocoDirective,
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    WidgetHeaderInstrumentSwitchComponent,
    AllTradesComponent,
    AllTradesSettingsComponent,
    AsyncPipe
  ]
})
export class AllTradesWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);

  shouldShowSettings = false;

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<AllTradesSettings>;
  showBadge$!: Observable<boolean>;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<AllTradesSettings>(
      this.widgetInstance(),
      'AllTradesSettings',
      settings => ({
        ...settings,
        allTradesColumns: getValueOrDefault(
          settings.allTradesColumns,
          allTradesWidgetColumns.filter(c => c.isDefault).map(col => col.id)
        ),
        highlightRowsBySide: getValueOrDefault(settings.highlightRowsBySide, false)
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<AllTradesSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
