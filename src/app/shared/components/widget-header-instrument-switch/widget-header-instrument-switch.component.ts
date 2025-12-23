import { Component, input, OnInit, viewChild, inject } from '@angular/core';
import {InstrumentsService} from "../../../modules/instruments/services/instruments.service";
import {WidgetSettingsService} from "../../services/widget-settings.service";
import {combineLatest, Observable, of, shareReplay, switchMap, take} from "rxjs";
import {WidgetSettings} from "../../models/widget-settings.model";
import {InstrumentKey} from "../../models/instruments/instrument-key.model";
import {Instrument} from "../../models/instruments/instrument.model";
import {InstrumentSearchComponent} from "../instrument-search/instrument-search.component";
import {defaultBadgeColor, toInstrumentKey} from "../../utils/instruments";
import {map} from "rxjs/operators";
import {ACTIONS_CONTEXT, ActionsContext} from "../../services/actions-context";
import {NzPopoverDirective} from 'ng-zorro-antd/popover';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzDropdownButtonDirective, NzDropDownDirective, NzDropdownMenuComponent} from 'ng-zorro-antd/dropdown';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzMenuDirective, NzMenuItemComponent} from 'ng-zorro-antd/menu';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {AsyncPipe} from '@angular/common';
import {toObservable} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-widget-header-instrument-switch',
  templateUrl: './widget-header-instrument-switch.component.html',
  styleUrls: ['./widget-header-instrument-switch.component.less'],
  imports: [
    NzPopoverDirective,
    NzButtonComponent,
    NzDropdownButtonDirective,
    NzDropDownDirective,
    NzIconDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    NzTypographyComponent,
    InstrumentSearchComponent,
    AsyncPipe
  ]
})
export class WidgetHeaderInstrumentSwitchComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly instrumentService = inject(InstrumentsService);
  private readonly actionsContext = inject<ActionsContext>(ACTIONS_CONTEXT);

  readonly widgetGuid = input.required<string>();

  readonly searchInput = viewChild(InstrumentSearchComponent);

  settings$!: Observable<WidgetSettings & InstrumentKey>;
  instrumentTitle$!: Observable<string>;
  searchVisible = false;
  readonly customTitle = input<string | null>(null);
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
        this.actionsContext.selectInstrument(instrument, settings.badgeColor ?? defaultBadgeColor);
        return;
      }

      this.widgetSettingsService.updateSettings<WidgetSettings & InstrumentKey>(
        settings.guid,
        {
          ...toInstrumentKey(instrument)
        }
      );
    });
  }
}
