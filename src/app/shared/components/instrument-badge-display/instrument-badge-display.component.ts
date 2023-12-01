import {Component, Input, OnInit} from '@angular/core';
import {InstrumentKey} from "../../models/instruments/instrument-key.model";
import {combineLatest, Observable, shareReplay} from "rxjs";
import {InstrumentGroups} from "../../models/dashboard/dashboard.model";
import {map} from "rxjs/operators";
import { defaultBadgeColor, instrumentsBadges } from "../../utils/instruments";
import {DashboardContextService} from "../../services/dashboard-context.service";
import {TerminalSettingsService} from "../../services/terminal-settings.service";

@Component({
  selector: 'ats-instrument-badge-display',
  templateUrl: './instrument-badge-display.component.html',
  styleUrls: ['./instrument-badge-display.component.less']
})
export class InstrumentBadgeDisplayComponent implements OnInit {
  @Input({required: true})
  instrumentKey!: InstrumentKey;

  selectedInstruments$!: Observable<InstrumentGroups>;

  constructor(
    private readonly currentDashboardService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService,
  ) {
  }

  ngOnInit(): void {
    this.selectedInstruments$ = combineLatest([
      this.currentDashboardService.instrumentsSelection$,
      this.terminalSettingsService.getSettings()
    ])
      .pipe(
        map(([badges, settings]) => {
          if (settings.badgesBind) {
            return badges;
          }

          const defaultInstrumentKey = badges[defaultBadgeColor];

          if(defaultInstrumentKey != null) {
            return {[defaultBadgeColor]: defaultInstrumentKey};
          }

          return {} as InstrumentGroups;
        }),
        shareReplay(1)
      );
  }

  getApplicableBadges(selectedGroups: InstrumentGroups): string[] {
    return Object.entries(selectedGroups)
      .filter(([key]) => instrumentsBadges.includes(key))
      .filter(([, value]) => this.isBadgeApplicable(value))
      .map(([key]) => key);
  }

  private isBadgeApplicable(selectedInstrument: InstrumentKey): boolean {
    return this.instrumentKey.symbol === selectedInstrument.symbol
      && this.instrumentKey.exchange === selectedInstrument.exchange
      && (
        this.instrumentKey.instrumentGroup == null
        || selectedInstrument.instrumentGroup == null
        || this.instrumentKey.instrumentGroup === selectedInstrument.instrumentGroup
      );
  }
}
