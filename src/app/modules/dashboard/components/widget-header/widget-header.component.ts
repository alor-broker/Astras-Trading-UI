import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  Observable,
  shareReplay,
  take
} from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { ModalService } from 'src/app/shared/services/modal.service';
import {
  getTypeBySettings,
  isInstrumentDependent,
  isPortfolioDependent
} from 'src/app/shared/utils/settings-helper';
import { AnySettings } from '../../../../shared/models/settings/any-settings.model';
import { joyrideContent } from '../../models/joyride';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { instrumentsBadges } from "../../../../shared/utils/instruments";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";
import { TerminalSettings } from "../../../../shared/models/terminal-settings/terminal-settings.model";


@Component({
  selector: 'ats-widget-header[guid][hasSettings][hasHelp]',
  templateUrl: './widget-header.component.html',
  styleUrls: ['./widget-header.component.less']
})
export class WidgetHeaderComponent implements OnInit {
  @Input()
  guid!: string;
  @Input()
  hasSettings!: boolean;
  @Input()
  shouldShowSettings = false;
  @Input()
  hasHelp!: boolean;
  @Output()
  switchSettingsEvent = new EventEmitter<boolean>();
  @Output()
  linkChangedEvent = new EventEmitter<boolean>();

  joyrideContent = joyrideContent;
  settings$!: Observable<AnySettings>;
  terminalSettings$!: Observable<TerminalSettings>;
  badges = instrumentsBadges;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly dashboardService: DashboardService,
    private readonly modal: ModalService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  ngOnInit() {
    this.terminalSettings$ = this.terminalSettingsService.getSettings();
    this.settings$ = this.settingsService.getSettings(this.guid).pipe(
      map(s => {
        const settings = {
          ...s
        };

        if (isInstrumentDependent(s)) {
          const group = s.instrumentGroup;
          settings.title = `${s.title} ${s.symbol} ${group ? '(' + group + ')' : ''} ${s.shortName}`;
        } else if (isPortfolioDependent(s)) {
          settings.title = `${s.title} ${s.portfolio} (${s.exchange})`;
        }

        return settings;
      }),
      shareReplay()
    );
  }

  switchSettings($event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();
    this.shouldShowSettings = !this.shouldShowSettings;
    this.switchSettingsEvent.emit(this.shouldShowSettings);
  }

  removeItem($event: MouseEvent | TouchEvent): void {
    $event.preventDefault();
    $event.stopPropagation();
    this.dashboardService.removeWidget(this.guid);
  }

  linkToActive($event: MouseEvent | TouchEvent, linkToActive: boolean): void {
    $event.preventDefault();
    $event.stopPropagation();

    this.settingsService.updateIsLinked(this.guid, linkToActive);
  }

  openHelp() {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      const name = getTypeBySettings(settings);
      if(!!name) {
        this.modal.openHelpModal(name);
      } else {
        throw new Error('Unknown widget type');
      }
    });
  }

  switchBadgeColor(badgeColor: string) {
    this.settingsService.updateSettings(this.guid, { badgeColor });
  }
}
