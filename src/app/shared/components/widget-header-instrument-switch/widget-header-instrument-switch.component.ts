import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { InstrumentsService } from "../../../modules/instruments/services/instruments.service";
import { WidgetSettingsService } from "../../services/widget-settings.service";
import { Observable, of, shareReplay, switchMap, take } from "rxjs";
import { WidgetSettings } from "../../models/widget-settings.model";
import { InstrumentKey } from "../../models/instruments/instrument-key.model";
import { Instrument } from "../../models/instruments/instrument.model";
import { InstrumentSearchComponent } from "../instrument-search/instrument-search.component";
import { DashboardContextService } from "../../services/dashboard-context.service";
import { defaultBadgeColor, toInstrumentKey } from "../../utils/instruments";
import { debounceTime, map } from "rxjs/operators";

@Component({
  selector: 'ats-widget-header-instrument-switch',
  templateUrl: './widget-header-instrument-switch.component.html',
  styleUrls: ['./widget-header-instrument-switch.component.less']
})
export class WidgetHeaderInstrumentSwitchComponent implements OnInit {
  @Input({required: true})
  widgetGuid!: string;

  @Input()
  customTitle?: string | null;

  @ViewChild(InstrumentSearchComponent)
  searchInput?: InstrumentSearchComponent;

  settings$!: Observable<WidgetSettings & InstrumentKey>;
  instrumentTitle$!: Observable<string>;
  searchVisible = false;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly instrumentService: InstrumentsService,
    private readonly dashboardContextService: DashboardContextService,
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<WidgetSettings & InstrumentKey>(this.widgetGuid).pipe(
      shareReplay(1)
    );

    this.instrumentTitle$ = this.settings$.pipe(
      debounceTime(300), // to prevent error when settings changed but customTitle not yet
      switchMap(s => {
        if (this.customTitle ?? '') {
          return of(this.customTitle!);
        }

        return this.instrumentService.getInstrument(s).pipe(
          map(i => this.getTitle(i))
        );
      }),
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
        this.dashboardContextService.selectDashboardInstrument(instrument, settings.badgeColor ?? defaultBadgeColor);
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
