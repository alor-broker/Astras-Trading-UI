import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { Observable } from 'rxjs';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { defaultBadgeColor } from '../../../../shared/utils/instruments';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import {
  allInstrumentsColumns,
  InstrumentSelectSettings
} from '../../models/instrument-select-settings.model';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { getValueOrDefault } from "../../../../shared/utils/object-helper";

@Component({
  selector: 'ats-instrument-select-widget',
  templateUrl: './instrument-select-widget.component.html',
  styleUrls: ['./instrument-select-widget.component.less']
})
export class InstrumentSelectWidgetComponent implements OnInit {
  shouldShowSettings = false;

  @Input({required: true})
  widgetInstance!: WidgetInstance;
  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<InstrumentSelectSettings>;
  showBadge$!: Observable<boolean>;
  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly terminalSettingsService: TerminalSettingsService,
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<InstrumentSelectSettings>(
      this.widgetInstance,
      'InstrumentSelectSettings',
      settings => ({
        ...settings,
        title: `Выбор инструмента`,
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
