import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import {
  allInstrumentsColumns,
  AllInstrumentsSettings
} from '../../../../shared/models/settings/all-instruments-settings.model';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { defaultBadgeColor } from '../../../../shared/utils/instruments';
import { Observable } from 'rxjs';
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';

@Component({
  selector: 'ats-all-instruments-widget[shouldShowSettings][guid][isBlockWidget]',
  templateUrl: './all-instruments-widget.component.html',
  styleUrls: ['./all-instruments-widget.component.less']
})
export class AllInstrumentsWidgetComponent implements OnInit {
  @Input() public shouldShowSettings!: boolean;
  @Input() public guid!: string;
  @Input()
  isBlockWidget!: boolean;
  @Output() public shouldShowSettingsChange = new EventEmitter<boolean>();

  settings$!: Observable<AllInstrumentsSettings>;
  showBadge$!: Observable<boolean>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<AllInstrumentsSettings>(
      this.guid,
      'AllInstrumentsSettings',
      settings => ({
        ...settings,
        badgeColor: defaultBadgeColor,
        allInstrumentsColumns: allInstrumentsColumns.filter(c => c.isDefault).map(col => col.columnId)
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<AllInstrumentsSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
