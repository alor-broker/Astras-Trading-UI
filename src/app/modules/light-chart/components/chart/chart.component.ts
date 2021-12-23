import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { LightChartSettings } from '../../../../shared/models/settings/light-chart-settings.model';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { LightChartService } from '../../services/light-chart.service';
import { Candle } from '../../models/candle.model';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import {
  widget,
  IChartingLibraryWidget,
  ChartingLibraryWidgetOptions,
  LanguageCode,
  ResolutionString,
} from '../../../../../assets/lib/charting_library'

@Component({
  selector: 'ats-chart[resize][widget]',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ChartComponent implements OnInit, OnDestroy {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  widget!: Widget<LightChartSettings>;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Input('settings') set settings(settings: LightChartSettings) {
    this.settings$.next(settings);
  }
  private settings$ = new BehaviorSubject<LightChartSettings | null>(null);
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  bars$: Observable<Candle | null> = of(null);
  resizeSub!: Subscription;
  guid: string | null = null;

  private chart!: IChartingLibraryWidget;

  private bars: Candle[] = [];
  private history$ = new Observable<void>();

  constructor(private service: LightChartService) {}

  ngOnInit(): void {
    this.guid = GuidGenerator.newGuid();
    this.bars$ = this.settings$.pipe(
      filter((s): s is LightChartSettings  => !!s),
      switchMap(s => this.service.getBars(s.symbol, s.exchange, s.timeFrame ?? 'D', s.from ?? 0))
    );
    const options = this.settings$.getValue();
    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: options?.symbol,
      datafeed: new (window as any).Datafeeds.UDFCompatibleDatafeed('https://apidev.alor.ru/md'),
      interval: 'D' as ResolutionString,
      container: this.guid,
      library_path: '/assets/lib/charting_library',
      locale: 'en',
      disabled_features: ['use_localstorage_for_settings'],
      enabled_features: ['study_templates'],
      // charts_storage_url: this._chartsStorageUrl,
      // charts_storage_api_version: this._chartsStorageApiVersion,
      // client_id: this._clientId,
      // user_id: this._userId,
      // fullscreen: this._fullscreen,
      // autosize: this._autosize,
  };

  const tvWidget = new widget(widgetOptions);
  this.chart = tvWidget;

  tvWidget.onChartReady(() => {
      tvWidget.headerReady().then(() => {
          const button = tvWidget.createButton();
          button.setAttribute('title', 'Click to show a notification popup');
          button.classList.add('apply-common-tooltip');
          button.addEventListener('click', () => tvWidget.showNoticeDialog({
                  title: 'Notification',
                  body: 'TradingView Charting Library API works correctly',
                  callback: () => {
                      console.log('Noticed!');
                  },
              }));
          button.innerHTML = 'Check API';
      });
  });
  }

  ngOnDestroy(): void {
    this.service.unsubscribe();
    this.history$
    this.resizeSub.unsubscribe();
  }

  ngAfterViewInit() {
    if (this.guid) {
      // this.chart = this.getChart(this.guid);
      this.bars$.subscribe((candle) => {

      });
      this.resizeSub = this.resize.subscribe((item) => {
        // this.chart.resize(item.width ?? 0, (item.height ?? 0) - 30);
      });
    }
  }

  private getChart(guid: string) {


  }
}
