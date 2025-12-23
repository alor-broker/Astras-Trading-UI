import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, input, inject } from '@angular/core';
import { InstrumentKey } from "../../models/instruments/instrument-key.model";
import {
  combineLatest,
  Observable,
  shareReplay
} from "rxjs";
import { InstrumentGroups } from "../../models/dashboard/dashboard.model";
import { map } from "rxjs/operators";
import {
  defaultBadgeColor,
  instrumentsBadges
} from "../../utils/instruments";
import { DashboardContextService } from "../../services/dashboard-context.service";
import { TerminalSettingsService } from "../../services/terminal-settings.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MergedBadgeComponent } from "../merged-badge/merged-badge.component";
import { LetDirective } from "@ngrx/component";

@Component({
    selector: 'ats-instrument-badge-display',
    templateUrl: './instrument-badge-display.component.html',
    styleUrls: ['./instrument-badge-display.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MergedBadgeComponent,
        LetDirective
    ]
})
export class InstrumentBadgeDisplayComponent implements OnInit {
  private readonly currentDashboardService = inject(DashboardContextService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly instrumentKey = input.required<InstrumentKey>();

  selectedInstruments$!: Observable<InstrumentGroups>;
  badgesColors$!: Observable<string[]>;

  ngOnInit(): void {
    this.selectedInstruments$ = combineLatest([
      this.currentDashboardService.instrumentsSelection$,
      this.terminalSettingsService.getSettings()
    ])
      .pipe(
        map(([badges, settings]) => {
          if (settings.badgesBind ?? false) {
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

    this.badgesColors$ = this.terminalSettingsService.getSettings()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(s => s.badgesColors ?? instrumentsBadges)
      );
  }

  getApplicableBadges(selectedGroups: InstrumentGroups, badgesColors: string[]): string[] {
    return Object.entries(selectedGroups)
      .filter(([key]) => badgesColors.includes(key))
      .filter(([, value]) => this.isBadgeApplicable(value!))
      .map(([key]) => key);
  }

  private isBadgeApplicable(selectedInstrument: InstrumentKey): boolean {
    const instrumentKey = this.instrumentKey();
    return instrumentKey.symbol === selectedInstrument.symbol
      && instrumentKey.exchange === selectedInstrument.exchange
      && (
        instrumentKey.instrumentGroup == null
        || selectedInstrument.instrumentGroup == null
        || instrumentKey.instrumentGroup === selectedInstrument.instrumentGroup
      );
  }
}
