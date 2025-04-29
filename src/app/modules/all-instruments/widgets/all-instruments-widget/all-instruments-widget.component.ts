import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { defaultBadgeColor } from '../../../../shared/utils/instruments';
import { Observable } from 'rxjs';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import {
  allInstrumentsColumns,
  AllInstrumentsSettings
} from '../../model/all-instruments-settings.model';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { getValueOrDefault } from "../../../../shared/utils/object-helper";

@Component({
    selector: 'ats-all-instruments-widget',
    templateUrl: './all-instruments-widget.component.html',
    styleUrls: ['./all-instruments-widget.component.less'],
    standalone: false
})
export class AllInstrumentsWidgetComponent implements OnInit {
  shouldShowSettings = false;

  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<AllInstrumentsSettings>;
  showBadge$!: Observable<boolean>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<AllInstrumentsSettings>(
      this.widgetInstance,
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
