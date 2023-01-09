import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  Observable,
  of,
  shareReplay,
  switchMap,
  take
} from 'rxjs';
import {
  filter,
  map
} from 'rxjs/operators';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { ModalService } from 'src/app/shared/services/modal.service';
import {
  getTypeBySettings,
  isInstrumentDependent,
  isPortfolioDependent
} from 'src/app/shared/utils/settings-helper';
import { AnySettings } from '../../../../shared/models/settings/any-settings.model';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { instrumentsBadges } from "../../../../shared/utils/instruments";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";
import { TerminalSettings } from "../../../../shared/models/terminal-settings/terminal-settings.model";
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { TranslatorService } from "../../../../shared/services/translator.service";
import { mapWith } from "../../../../shared/utils/observable-helper";


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

  settings$!: Observable<AnySettings>;
  terminalSettings$!: Observable<TerminalSettings>;
  badges = instrumentsBadges;

  title$!: Observable<string | null>;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly dashboardService: DashboardService,
    private readonly modal: ModalService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly instrumentService: InstrumentsService,
    private readonly translatorService: TranslatorService
  ) {
  }

  ngOnInit() {
    this.terminalSettings$ = this.terminalSettingsService.getSettings();
    this.settings$ = this.settingsService.getSettings(this.guid).pipe(
      shareReplay(1),
      mapWith(
        () => this.translatorService.getTranslator(''),
        (settings, translate) => ({ settings, translate })
      ),
      map(({ settings, translate }) => ({
        ...settings,
        title: translate(
          ['widgetHeaders', settings.settingsType!],
          { fallback: settings.title }
        )
      }))
    );

    this.title$ = this.settings$.pipe(
      switchMap(settings => {
        if (isPortfolioDependent(settings)) {
          return of(`${settings.portfolio} (${settings.exchange})`);
        }
        else if (isInstrumentDependent(settings)) {
          return this.getInstrumentDependentTitle(settings);
        }

        return of(settings.title ?? null);
      })
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
      if (!!name) {
        this.modal.openHelpModal(name);
      }
      else {
        throw new Error('Unknown widget type');
      }
    });
  }

  switchBadgeColor(badgeColor: string) {
    this.settingsService.updateSettings(this.guid, { badgeColor });
  }

  private getInstrumentDependentTitle(settings: AnySettings): Observable<string> {
    return this.instrumentService.getInstrument(settings as InstrumentKey).pipe(
      filter((x): x is Instrument => !!x),
      map(x => `${x.symbol} ${x.instrumentGroup ? '(' + x.instrumentGroup + ')' : ''} ${x.shortName}`)
    );
  }
}
