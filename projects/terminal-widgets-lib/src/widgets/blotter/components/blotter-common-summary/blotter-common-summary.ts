import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
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
import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {BlotterWidgetSettings} from '@terminal-widgets-lib/widgets/blotter/widget-settings.types';
import {WidgetSettingsHelper} from '@terminal-core-lib/features/widget-settings/utils/widget-settings.helper';
import {PortfolioSummaryService} from '@terminal-core-lib/features/portfolios/services/portfolio-summary.service';
import {CommonSummaryView} from '@terminal-core-lib/features/portfolios/services/portfolio-summary-service.types';

@Component({
  selector: 'ats-blotter-common-summary',
  templateUrl: './blotter-common-summary.html',
  styleUrls: ['./blotter-common-summary.less'],
  imports: [
    NzResizeObserverDirective,
    TranslocoDirective,
    NzDescriptionsComponent,
    NzDescriptionsItemComponent,
    AsyncPipe,
    NgTemplateOutlet
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class BlotterCommonSummary implements OnInit {
  readonly shouldShowSettings = input.required<boolean>();

  readonly guid = input.required<string>();

  readonly shouldShowSettingsChange = output<boolean>();

  summary$: Observable<CommonSummaryView> = of();

  readonly columns = signal(1);

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
        this.columns.set(1);
      } else if (width < 900) {
        this.columns.set(2);
      } else if (width < 1500) {
        this.columns.set(3);
      } else {
        this.columns.set(4);
      }
    });
  }
}
