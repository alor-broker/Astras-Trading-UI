import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { defaultBadgeColor } from '../../../../shared/utils/instruments';
import { Observable } from 'rxjs';
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import {
  allInstrumentsColumns,
  AllInstrumentsSettings
} from '../../model/all-instruments-settings.model';
import { WidgetsHelper } from "../../../../shared/utils/widgets";
import { WidgetNames } from "../../../../shared/models/enums/widget-names";

@Component({
  selector: 'ats-all-instruments-widget[guid][isBlockWidget]',
  templateUrl: './all-instruments-widget.component.html',
  styleUrls: ['./all-instruments-widget.component.less']
})
export class AllInstrumentsWidgetComponent implements OnInit {
  shouldShowSettings: boolean = false;
  @Input() public guid!: string;
  @Input()
  isBlockWidget!: boolean;

  settings$!: Observable<AllInstrumentsSettings>;
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
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<AllInstrumentsSettings>(
      this.guid,
      'AllInstrumentsSettings',
      settings => ({
        ...settings,
        badgeColor: defaultBadgeColor,
        allInstrumentsColumns: allInstrumentsColumns.filter(c => c.isDefault).map(col => col.columnId),
        titleIcon: new WidgetsHelper().getIconName(WidgetNames.allInstruments)
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<AllInstrumentsSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
