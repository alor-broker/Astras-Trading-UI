import { Component, input, OnInit, inject } from '@angular/core';
import {Observable} from 'rxjs';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {WidgetSettingsCreationHelper} from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import {defaultBadgeColor} from '../../../../shared/utils/instruments';
import {SettingsHelper} from '../../../../shared/utils/settings-helper';
import {allInstrumentsColumns, InstrumentSelectSettings} from '../../models/instrument-select-settings.model';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {getValueOrDefault} from "../../../../shared/utils/object-helper";
import {WatchInstrumentsService} from "../../services/watch-instruments.service";
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeletonComponent} from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import {WidgetHeaderComponent} from '../../../../shared/components/widget-header/widget-header.component';
import {InstrumentSelectComponent} from '../../components/instrument-select/instrument-select.component';
import {
  InstrumentSelectSettingsComponent
} from '../../components/instrument-select-settings/instrument-select-settings.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-instrument-select-widget',
  templateUrl: './instrument-select-widget.component.html',
  styleUrls: ['./instrument-select-widget.component.less'],
  providers: [WatchInstrumentsService],
  imports: [
    TranslocoDirective,
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    InstrumentSelectComponent,
    InstrumentSelectSettingsComponent,
    AsyncPipe
  ]
})
export class InstrumentSelectWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);

  shouldShowSettings = false;

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<InstrumentSelectSettings>;
  showBadge$!: Observable<boolean>;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<InstrumentSelectSettings>(
      this.widgetInstance(),
      'InstrumentSelectSettings',
      settings => ({
        ...settings,
        titleIcon: 'eye',
        instrumentColumns: getValueOrDefault(settings.instrumentColumns, allInstrumentsColumns.filter(c => c.isDefault).map(c => c.id)),
        badgeColor: defaultBadgeColor,
        showFavorites: getValueOrDefault(settings.showFavorites, true)
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<InstrumentSelectSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
