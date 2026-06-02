import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {
  combineLatest,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  take
} from 'rxjs';
import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';
import {
  Instrument,
  InstrumentKey
} from '@terminal-core-lib/common/types/instrument.types';
import {toObservable} from '@angular/core/rxjs-interop';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {ACTIONS_CONTEXT} from '@terminal-core-lib/features/dashboard/types/dashboard-actions-context.types';
import {InlineInstrumentSearch} from '@terminal-core-lib/features/instruments/components/inline-instrument-search/inline-instrument-search';
import {AsyncPipe} from '@angular/common';
import {NzPopoverDirective} from 'ng-zorro-antd/popover';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {
  NzDropdownDirective,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {
  NzMenuDirective,
  NzMenuItemComponent
} from 'ng-zorro-antd/menu';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {DeviceService} from '@terminal-core-lib/common/services/device.service';

@Component({
  selector: 'ats-widget-header-instrument-switch',
  imports: [
    AsyncPipe,
    NzPopoverDirective,
    NzButtonComponent,
    NzDropdownDirective,
    NzIconDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    InlineInstrumentSearch,
    NzTypographyComponent
  ],
  templateUrl: './widget-header-instrument-switch.html',
  styleUrl: './widget-header-instrument-switch.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetHeaderInstrumentSwitch implements OnInit {
  readonly widgetGuid = input.required<string>();

  readonly searchInput = viewChild(InlineInstrumentSearch);

  settings$!: Observable<WidgetSettings & InstrumentKey>;

  instrumentTitle$!: Observable<string>;

  searchVisible = false;

  readonly customTitle = input<string | null>(null);

  protected readonly deviceInfo$ = inject(DeviceService).deviceInfo$;

  private readonly widgetSettingsService = inject(WidgetSettingsService);

  private readonly instrumentService = inject(InstrumentsService);

  private readonly actionsContext = inject(ACTIONS_CONTEXT);

  private readonly customTitleChanges$ = toObservable(this.customTitle);

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<WidgetSettings & InstrumentKey>(this.widgetGuid()).pipe(
      shareReplay(1)
    );

    this.instrumentTitle$ = combineLatest({
      explicitTitle: this.customTitleChanges$,
      settings: this.settings$
    }).pipe(
      switchMap(x => {
        if (x.explicitTitle != null && !!x.explicitTitle.length) {
          return of(x.explicitTitle);
        }

        return this.instrumentService.getInstrument(x.settings).pipe(
          map(i => this.getTitle(i))
        );
      })
    );
  }

  triggerMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    event.target!.dispatchEvent(new Event('click'));
  }

  getTitle(instrument: Instrument | null): string {
    if (!instrument) {
      return '';
    }

    return `${instrument.symbol}${(instrument.instrumentGroup ?? '') ? ' (' + (instrument.instrumentGroup!) + ') ' : ' '}${instrument.shortName}`;
  }

  searchVisibilityChanged(isVisible: boolean): void {
    this.searchInput()?.writeValue(null);
    if (isVisible) {
      this.searchInput()?.setFocus();
    }
  }

  close(): void {
    this.searchVisible = false;
    this.searchVisibilityChanged(false);
  }

  instrumentSelected(instrument: InstrumentKey | null): void {
    this.close();

    if (!instrument) {
      return;
    }

    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      if (settings.linkToActive ?? false) {
        this.actionsContext.selectInstrument(instrument, settings.badgeColor ?? DefaultBadge);
        return;
      }

      this.widgetSettingsService.updateSettings<WidgetSettings & InstrumentKey>(
        settings.guid,
        {
          ...InstrumentKeyHelper.toInstrumentKey(instrument)
        }
      );
    });
  }
}
