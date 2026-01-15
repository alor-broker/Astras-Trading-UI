import { Component, input, OnInit, inject } from '@angular/core';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {WidgetSettingsCreationHelper} from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import {defaultBadgeColor} from '../../../../shared/utils/instruments';
import {Observable} from 'rxjs';
import {SettingsHelper} from '../../../../shared/utils/settings-helper';
import {allInstrumentsColumns, AllInstrumentsSettings} from '../../model/all-instruments-settings.model';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {getValueOrDefault} from "../../../../shared/utils/object-helper";
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeletonComponent} from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import {WidgetHeaderComponent} from '../../../../shared/components/widget-header/widget-header.component';
import {AllInstrumentsComponent} from '../../components/all-instruments/all-instruments.component';
import {
  AllInstrumentsSettingsComponent
} from '../../components/all-instruments-settings/all-instruments-settings.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-all-instruments-widget',
  templateUrl: './all-instruments-widget.component.html',
  styleUrls: ['./all-instruments-widget.component.less'],
  imports: [
    TranslocoDirective,
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    AllInstrumentsComponent,
    AllInstrumentsSettingsComponent,
    AsyncPipe
  ]
})
export class AllInstrumentsWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);

  shouldShowSettings = false;

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<AllInstrumentsSettings>;
  showBadge$!: Observable<boolean>;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<AllInstrumentsSettings>(
      this.widgetInstance(),
      'AllInstrumentsSettings',
      settings => ({
        ...settings,
        badgeColor: getValueOrDefault(settings.badgeColor, defaultBadgeColor),
        allInstrumentsColumns: getValueOrDefault(
          settings.allInstrumentsColumns,
          allInstrumentsColumns.filter(c => c.isDefault).map(col => col.id)
        )
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<AllInstrumentsSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
