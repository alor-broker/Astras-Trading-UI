import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  ViewEncapsulation
} from '@angular/core';
import {
  distinctUntilChanged,
  Observable,
  of,
  switchMap
} from 'rxjs';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzDescriptionsComponent,
  NzDescriptionsItemComponent
} from 'ng-zorro-antd/descriptions';
import {AsyncPipe} from '@angular/common';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {BlotterWidgetSettings} from '@terminal-widgets-lib/widgets/blotter/widget-settings.types';
import {WidgetSettingsHelper} from '@terminal-core-lib/features/widget-settings/utils/widget-settings.helper';
import {PortfolioSummaryService} from '@terminal-core-lib/features/portfolios/services/portfolio-summary.service';
import {CommonSummaryView} from '@terminal-core-lib/features/portfolios/services/portfolio-summary-service.types';

@Component({
  selector: 'ats-blotter-common-summary',
  templateUrl: './blotter-forward-summary.html',
  styleUrls: ['./blotter-forward-summary.less'],
  imports: [
    NzResizeObserverDirective,
    TranslocoDirective,
    NzDescriptionsComponent,
    NzDescriptionsItemComponent,
    AsyncPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class BlotterCommonSummary implements OnInit {
  readonly shouldShowSettings = input.required<boolean>();

  readonly guid = input.required<string>();

  readonly shouldShowSettingsChange = output<boolean>();

  summary$: Observable<CommonSummaryView> = of();

  columns = 1;

  private readonly settingsService = inject(WidgetSettingsService);

  private readonly service = inject(PortfolioSummaryService);

  ngOnInit(): void {
    this.summary$ = this.settingsService.getSettings<BlotterWidgetSettings>(this.guid()).pipe(
      distinctUntilChanged((previous, current) => WidgetSettingsHelper.isEqualPortfolioDependedSettings(previous, current)),
      switchMap(settings => this.service.getCommonSummary(settings))
    );
  }

  containerSizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      const width = Math.floor(x.contentRect.width);
      if (width <= 600) {
        this.columns = 1;
      } else if (width < 900) {
        this.columns = 2;
      } else if (width < 1500) {
        this.columns = 3;
      } else {
        this.columns = 4;
      }
    });
  }
}
