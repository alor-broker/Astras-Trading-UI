import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  OnInit
} from '@angular/core';
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
  ],
  standalone: true
})
export class InstrumentBadgeDisplayComponent implements OnInit {
  @Input({required: true})
  instrumentKey!: InstrumentKey;

  selectedInstruments$!: Observable<InstrumentGroups>;
  badgesColors$!: Observable<string[]>;

  constructor(
    private readonly currentDashboardService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly destroyRef: DestroyRef
  ) {
  }

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
    return this.instrumentKey.symbol === selectedInstrument.symbol
      && this.instrumentKey.exchange === selectedInstrument.exchange
      && (
        this.instrumentKey.instrumentGroup == null
        || selectedInstrument.instrumentGroup == null
        || this.instrumentKey.instrumentGroup === selectedInstrument.instrumentGroup
      );
  }
}
