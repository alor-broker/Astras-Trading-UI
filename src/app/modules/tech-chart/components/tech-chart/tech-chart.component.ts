import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
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
  takeUntil
} from "rxjs";
import { TechChartSettings } from "../../../../shared/models/settings/tech-chart-settings.model";
import { isEqualTechChartSettings } from "../../../../shared/utils/settings-helper";
import {
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString,
  widget
} from "../../../../../assets/charting_library";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { TechChartDatafeedService } from "../../services/tech-chart-datafeed.service";
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";
import {
  map,
  startWith
} from "rxjs/operators";

@Component({
  selector: 'ats-tech-chart[guid][shouldShowSettings][resize]',
  templateUrl: './tech-chart.component.html',
  styleUrls: ['./tech-chart.component.less']
})
export class TechChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() shouldShowSettings!: boolean;
  @Input() guid!: string;
  @Input() resize!: EventEmitter<DashboardItem>;

  @ViewChild('chartContainer', { static: true })
  chartContainer?: ElementRef<HTMLElement>;

  containerHeight$?: Observable<string>;

  private chart?: IChartingLibraryWidget;
  private settings$?: Observable<TechChartSettings>;
  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly techChartDatafeedService: TechChartDatafeedService
  ) {
  }

  ngOnInit(): void {
    this.initSettingsStream();

    this.containerHeight$ = this.resize?.pipe(
      map(x => x.height ?? 300),
      map(x => `${x}px`)
    );
  }

  ngOnDestroy() {
    this.chart?.remove();
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

  private createChart(settings: TechChartSettings) {
    this.chart?.remove();

    if (!this.chartContainer) {
      return;
    }

    const config: ChartingLibraryWidgetOptions = {
      // debug
      debug: true,
      // base options
      container: this.chartContainer.nativeElement,
      symbol: `${settings.exchange}:${settings.symbol}:${settings.instrumentGroup}`,
      interval: '1D' as ResolutionString,
      locale: "ru",
      library_path: '/assets/charting_library/',
      datafeed: this.techChartDatafeedService,
      // additional options
      fullscreen: false,
      autosize: true,
      timezone: 'exchange',
      theme: 'Dark',
      time_frames: [
        { text: "1000y", resolution:"1M" as ResolutionString, description: "Все", title: "Все" },
        { text: "3y", resolution: "1M" as ResolutionString, description: "3 года", title: "3г" },
        { text: "1y", resolution: "1D" as ResolutionString, description: "1 год", title: "1г" },
        { text: "6m", resolution: "1D" as ResolutionString, description: "6 месяцев", title: "6М"  },
        { text: "3m", resolution: "4H" as ResolutionString, description: "3 месяца", title: "3М"  },
        { text: "1m", resolution: "1H" as ResolutionString, description: "1 месяц", title: "1М"  },
        { text: "14d", resolution: "1H" as ResolutionString, description: "2 недели", title: "2Н"  },
        { text: "7d", resolution: "15" as ResolutionString, description: "1 неделя", title: "1Н" },
        { text: "1d", resolution: "5" as ResolutionString as ResolutionString, description: "1 день", title: "1д" },
      ],
      //features
      disabled_features: [
        'header_chart_type',
        'header_compare',
        'header_symbol_search',
        'symbol_info',
        'left_toolbar',
        'use_localstorage_for_settings'
      ]
    };

    this.chart = new widget(config);
  }
}
