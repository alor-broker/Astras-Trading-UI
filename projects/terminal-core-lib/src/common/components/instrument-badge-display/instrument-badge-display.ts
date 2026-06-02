import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {DesktopDashboardContextService} from '../../../features/dashboard/desktop/services/desktop-dashboard-context.service';
import {TerminalSettingsService} from '../../../features/terminal-settings/services/terminal-settings.service';
import {InstrumentKey} from '../../types/instrument.types';
import {
  combineLatest,
  map,
  Observable,
  of,
  shareReplay
} from 'rxjs';
import {InstrumentGroups} from '../../../features/dashboard/types/dashboard.types';
import {
  BaseBadges,
  DefaultBadge
} from '../../../features/instruments/constants/badges.constants';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {LetDirective} from '@ngrx/component';
import {MergedBadge} from '../merged-badge/merged-badge';

@Component({
  selector: 'ats-instrument-badge-display',
  imports: [
    LetDirective,
    MergedBadge
  ],
  templateUrl: './instrument-badge-display.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstrumentBadgeDisplay implements OnInit {
  readonly instrumentKey = input.required<InstrumentKey>();

  selectedInstruments$!: Observable<InstrumentGroups>;

  badgesColors$!: Observable<string[]>;

  private readonly currentDashboardService = inject(DesktopDashboardContextService, {optional: true});

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (this.currentDashboardService == null) {
      this.selectedInstruments$ = of({});
      this.badgesColors$ = of([]);
    } else {
      this.selectedInstruments$ = combineLatest([
        this.currentDashboardService.instrumentsSelection$,
        this.terminalSettingsService.getSettings()
      ])
        .pipe(
          map(([badges, settings]) => {
            if (settings.badgesBind ?? false) {
              return badges;
            }

            const defaultInstrumentKey = badges[DefaultBadge];

            if (defaultInstrumentKey != null) {
              return {[DefaultBadge]: defaultInstrumentKey};
            }

            return {} as InstrumentGroups;
          }),
          shareReplay(1)
        );

      this.badgesColors$ = this.terminalSettingsService.getSettings()
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          map(s => s.badgesColors ?? BaseBadges)
        );
    }
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
