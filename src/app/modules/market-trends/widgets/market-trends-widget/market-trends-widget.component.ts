import {Component, Inject, Input, OnInit} from '@angular/core';
import {AsyncPipe} from "@angular/common";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {Observable, take} from "rxjs";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {ACTIONS_CONTEXT, ActionsContext} from "../../../../shared/services/actions-context";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {WidgetSettingsCreationHelper} from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {getValueOrDefault} from "../../../../shared/utils/object-helper";
import {defaultBadgeColor} from "../../../../shared/utils/instruments";
import {SettingsHelper} from "../../../../shared/utils/settings-helper";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {MarketTrendsSettings} from "../../models/market-trends-settings.model";
import {ExtendedFilter, MarketSector} from "../../../../shared/models/market-typings.model";
import {MarketTrendsComponent} from "../../components/market-trends/market-trends.component";
import {MarketTrendsSettingsComponent} from "../../components/market-trends-settings/market-trends-settings.component";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";

@Component({
  selector: 'ats-market-trends-widget',
  imports: [
    AsyncPipe,
    MarketTrendsComponent,
    MarketTrendsSettingsComponent,
    WidgetSkeletonComponent,
    WidgetHeaderComponent
  ],
  templateUrl: './market-trends-widget.component.html',
  styleUrl: './market-trends-widget.component.less'
})
export class MarketTrendsWidgetComponent implements OnInit {
  shouldShowSettings = false;
  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<MarketTrendsSettings>;

  showBadge$!: Observable<boolean>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    @Inject(ACTIONS_CONTEXT)
    private readonly actionsContext: ActionsContext,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<MarketTrendsSettings>(
      this.widgetInstance,
      'MarketTrendsSettings',
      settings => ({
        ...settings,
        badgeColor: getValueOrDefault(settings.badgeColor, defaultBadgeColor),
        displaySectors: getValueOrDefault(
          settings.displaySectors,
          settings.availableSectors ?? Object.values(MarketSector)
        ),
        extendedFilter: getValueOrDefault(
          settings.extendedFilter,
          settings.availableExtendedFilters ?? Object.values(ExtendedFilter)
        ),
        itemsCount: getValueOrDefault(settings.itemsCount, 20)
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<MarketTrendsSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }

  selectInstrument(instrumentKey: InstrumentKey): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(s => {
      this.actionsContext.selectInstrument(instrumentKey, s.badgeColor ?? defaultBadgeColor);
    });
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }
}
