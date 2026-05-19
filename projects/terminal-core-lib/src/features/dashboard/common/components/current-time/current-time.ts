import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  map,
  Observable,
  startWith,
  timer
} from 'rxjs';
import {TerminalSettingsService} from '../../../../terminal-settings/services/terminal-settings.service';
import {
  TerminalSettings,
  TimezoneDisplayOption
} from '../../../../terminal-settings/terminal-settings.types';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {mapWith} from '../../../../../common/utils/observable/map-with';
import {TZDate} from '@date-fns/tz';
import {
  AsyncPipe,
  DatePipe
} from '@angular/common';

@Component({
  selector: 'ats-current-time',
  imports: [
    AsyncPipe,
    DatePipe
  ],
  templateUrl: './current-time.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CurrentTime implements OnInit {
  time$!: Observable<Date>;

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly destroyRef = inject(DestroyRef);

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
      })
    );
  }
}
