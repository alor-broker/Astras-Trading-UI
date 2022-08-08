import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  distinctUntilChanged,
  Observable,
  shareReplay,
  Subject,
  take,
  takeUntil
} from 'rxjs';
import { TechChartSettings } from '../../../../shared/models/settings/tech-chart-settings.model';
import { isEqualTechChartSettings } from '../../../../shared/utils/settings-helper';
import {
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  InitialSettingsMap,
  ISettingsAdapter,
  ResolutionString,
  SubscribeEventsMap,
  widget
} from '../../../../../assets/charting_library';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { TechChartDatafeedService } from '../../services/tech-chart-datafeed.service';
import { DashboardItemContentSize } from '../../../../shared/models/dashboard-item.model';

@Component({
  selector: 'ats-tech-chart[guid][shouldShowSettings][contentSize]',
  templateUrl: './tech-chart.component.html',
  styleUrls: ['./tech-chart.component.less']
})
export class TechChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input()
  shouldShowSettings!: boolean;

  @Input()
  guid!: string;

  @Input()
  contentSize!: DashboardItemContentSize | null;

  @ViewChild('chartContainer', { static: true })
  chartContainer?: ElementRef<HTMLElement>;

  private chart?: IChartingLibraryWidget;
  private settings$?: Observable<TechChartSettings>;
  private readonly destroy$: Subject<boolean> = new Subject<boolean>();
  private chartEventSubscriptions: { event: (keyof SubscribeEventsMap), callback: SubscribeEventsMap[keyof SubscribeEventsMap] }[] = [];

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly techChartDatafeedService: TechChartDatafeedService
  ) {
  }

  ngOnInit(): void {
    this.initSettingsStream();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.clearChartEventsSubscription(this.chart);
      this.chart?.remove();
    }

    this.techChartDatafeedService.clear();

    this.destroy$.next(true);
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.settings$?.pipe(
      distinctUntilChanged((previous, current) => {
        return (
          previous?.symbol === current?.symbol &&
          previous?.exchange === current?.exchange
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.createChart(settings);
    });
  }

  private initSettingsStream() {
    this.settings$ = this.settingsService.getSettings<TechChartSettings>(this.guid)
    .pipe(
      distinctUntilChanged((previous, current) => isEqualTechChartSettings(previous, current)),
      shareReplay(1)
    );
  }

  private createSettingsAdapter(initialSettings: TechChartSettings): ISettingsAdapter {
    const scope = this;

    return {
      get initialSettings(): InitialSettingsMap | undefined {
        return initialSettings.chartSettings;
      },

      setValue(key: string, value: string): void {
        scope.settings$?.pipe(
          take(1)
        ).subscribe(settings => {
          scope.settingsService.updateSettings<TechChartSettings>(
            settings.guid,
            {
              chartSettings: {
                ...settings.chartSettings,
                [key]: value
              }
            }
          );
        });
      },

      removeValue(key: string): void {
        scope.settings$?.pipe(
          take(1)
        ).subscribe(settings => {
          const updatedSettings = {
            ...settings.chartSettings
          };

          delete updatedSettings[key];

          scope.settingsService.updateSettings<TechChartSettings>(
            settings.guid,
            {
              chartSettings: updatedSettings
            }
          );
        });
      }
    };
  }

  private createChart(settings: TechChartSettings) {
    if (this.chart) {
      this.clearChartEventsSubscription(this.chart);
      this.chart?.remove();
    }

    if (!this.chartContainer) {
      return;
    }

    const config: ChartingLibraryWidgetOptions = {
      // debug
      debug: false,
      // base options
      container: this.chartContainer.nativeElement,
      symbol: `${settings.exchange}:${settings.symbol}:${settings.instrumentGroup}`,
      interval: '1D' as ResolutionString,
      locale: 'ru',
      library_path: '/assets/charting_library/',
      datafeed: this.techChartDatafeedService,
      settings_adapter: this.createSettingsAdapter(settings),
      // additional options
      fullscreen: false,
      autosize: true,
      timezone: 'exchange',
      theme: 'Dark',
      time_frames: [
        { text: '1000y', resolution: '1M' as ResolutionString, description: 'Все', title: 'Все' },
        { text: '3y', resolution: '1M' as ResolutionString, description: '3 года', title: '3г' },
        { text: '1y', resolution: '1D' as ResolutionString, description: '1 год', title: '1г' },
        { text: '6m', resolution: '1D' as ResolutionString, description: '6 месяцев', title: '6М' },
        { text: '3m', resolution: '4H' as ResolutionString, description: '3 месяца', title: '3М' },
        { text: '1m', resolution: '1H' as ResolutionString, description: '1 месяц', title: '1М' },
        { text: '14d', resolution: '1H' as ResolutionString, description: '2 недели', title: '2Н' },
        { text: '7d', resolution: '15' as ResolutionString, description: '1 неделя', title: '1Н' },
        { text: '1d', resolution: '5' as ResolutionString as ResolutionString, description: '1 день', title: '1д' },
      ],
      studies_access: {
        type: 'black',
        tools: [
          { name: 'Ratio' },
          { name: 'Spread' },
          { name: 'Correlation - Log' },
        ]
      },
      //features
      disabled_features: [
        'header_compare',
        'header_symbol_search',
        'symbol_info',
        'display_market_status',
      ],
      enabled_features: [
        'side_toolbar_in_fullscreen_mode'
      ]
    };

    this.chart = new widget(config);

    this.subscribeToChartEvent(
      this.chart,
      'drawing',
      () => this.settingsService.updateIsLinked(settings.guid, false)
    );
  }

  private subscribeToChartEvent(target: IChartingLibraryWidget, event: (keyof SubscribeEventsMap), callback: SubscribeEventsMap[keyof SubscribeEventsMap]) {
    this.chartEventSubscriptions.push({ event: event, callback });
    target.subscribe(event, callback);
  }

  private clearChartEventsSubscription(target: IChartingLibraryWidget) {
    this.chartEventSubscriptions.forEach(subscription => target.unsubscribe(subscription.event, subscription.callback));
    this.chartEventSubscriptions = [];
  }
}
