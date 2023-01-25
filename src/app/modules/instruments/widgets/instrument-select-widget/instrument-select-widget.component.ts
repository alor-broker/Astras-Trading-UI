import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { Observable } from 'rxjs';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { defaultBadgeColor } from '../../../../shared/utils/instruments';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import {
  allInstrumentsColumns,
  InstrumentSelectSettings
} from '../../models/instrument-select-settings.model';

@Component({
  selector: 'ats-instrument-select-widget[guid][isBlockWidget]',
  templateUrl: './instrument-select-widget.component.html',
  styleUrls: ['./instrument-select-widget.component.less'],
  providers: [WatchInstrumentsService]
})
export class InstrumentSelectWidgetComponent implements OnInit {
  shouldShowSettings: boolean = false;
  @Input()
  guid!: string;
  @Input()
  isBlockWidget!: boolean;
  settings$!: Observable<InstrumentSelectSettings>;
  showBadge$!: Observable<boolean>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  onSettingsChange() {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<InstrumentSelectSettings>(
      this.guid,
      'InstrumentSelectSettings',
      settings => ({
        ...settings,
        title: `Выбор инструмента`,
        titleIcon: 'eye',
        instrumentColumns: allInstrumentsColumns.filter(c => c.isDefault).map(c => c.columnId),
        badgeColor: defaultBadgeColor
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<InstrumentSelectSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
