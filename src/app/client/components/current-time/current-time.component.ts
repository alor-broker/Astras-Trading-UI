import {
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';
import { TerminalSettingsService } from "../../../shared/services/terminal-settings.service";
import {
  asyncScheduler,
  map,
  Observable,
  startWith,
  subscribeOn,
  timer
} from "rxjs";
import { CommonModule } from "@angular/common";
import { TimezoneDisplayOption } from "../../../shared/models/enums/timezone-display-option";
import { TerminalSettings } from "../../../shared/models/terminal-settings/terminal-settings.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { mapWith } from "../../../shared/utils/observable-helper";
import { TZDate } from "@date-fns/tz";

@Component({
  selector: 'ats-current-time',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './current-time.component.html',
  styleUrl: './current-time.component.less'
})
export class CurrentTimeComponent implements OnInit {
  time$!: Observable<Date>;

  constructor(
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    const timezone$ = this.terminalSettingsService.getSettings().pipe(
      map((s: TerminalSettings) => {
        return s.timezoneDisplayOption === TimezoneDisplayOption.MskTime
          ? 'Europe/Moscow'
          : null;
      }),
    );

    const currentDate$ = timer(0, 1000).pipe(
      map(() => new Date()),
      startWith(new Date()),
      takeUntilDestroyed(this.destroyRef)
    );

    this.time$ = timezone$.pipe(
      mapWith(
        () => currentDate$,
        (timezone, date) => ({timezone, date})
      ),
      map(x => {
        if (x.timezone == null) {
          return x.date;
        }

        return new TZDate().withTimeZone(x.timezone);
      }),
      subscribeOn(asyncScheduler)
    );
  }
}
