import {
  Component,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { InstrumentsService } from "../../../modules/instruments/services/instruments.service";
import { WidgetSettingsService } from "../../services/widget-settings.service";
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
  shareReplay,
  switchMap,
  take
} from "rxjs";
import { WidgetSettings } from "../../models/widget-settings.model";
import { InstrumentKey } from "../../models/instruments/instrument-key.model";
import { Instrument } from "../../models/instruments/instrument.model";
import { InstrumentSearchComponent } from "../instrument-search/instrument-search.component";
import {
  defaultBadgeColor,
  toInstrumentKey
} from "../../utils/instruments";
import { map } from "rxjs/operators";
import {
  ACTIONS_CONTEXT,
  ActionsContext
} from "../../services/actions-context";

@Component({
  selector: 'ats-widget-header-instrument-switch',
  templateUrl: './widget-header-instrument-switch.component.html',
  styleUrls: ['./widget-header-instrument-switch.component.less']
})
export class WidgetHeaderInstrumentSwitchComponent implements OnInit, OnDestroy {
  private readonly explicitTitle$ = new BehaviorSubject<string | null>(null);
  @Input({ required: true })
  widgetGuid!: string;

  @Input()
  set customTitle(value: string | null) {
    this.explicitTitle$.next(value);
  }

  @ViewChild(InstrumentSearchComponent)
  searchInput?: InstrumentSearchComponent;

  settings$!: Observable<WidgetSettings & InstrumentKey>;
  instrumentTitle$!: Observable<string>;
  searchVisible = false;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly instrumentService: InstrumentsService,
    @Inject(ACTIONS_CONTEXT)
    private readonly actionsContext: ActionsContext
  ) {
  }

  ngOnDestroy(): void {
    this.explicitTitle$.complete();
  }

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<WidgetSettings & InstrumentKey>(this.widgetGuid).pipe(
      shareReplay(1)
    );

    this.instrumentTitle$ = combineLatest({
      explicitTitle: this.explicitTitle$,
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
    this.searchInput?.writeValue(null);
    if (isVisible) {
      this.searchInput?.setFocus();
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
        this.actionsContext.instrumentSelected(instrument, settings.badgeColor ?? defaultBadgeColor);
        return;
      }

      this.widgetSettingsService.updateSettings(
        settings.guid,
        {
          ...toInstrumentKey(instrument)
        }
      );
    });
  }
}
