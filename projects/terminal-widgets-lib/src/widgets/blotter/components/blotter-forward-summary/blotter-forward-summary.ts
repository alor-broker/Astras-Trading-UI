import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {
  distinctUntilChanged,
  Observable,
  switchMap
} from "rxjs";
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzDescriptionsComponent,
  NzDescriptionsItemComponent
} from 'ng-zorro-antd/descriptions';
import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {PortfolioSummaryService} from '@terminal-core-lib/features/portfolios/services/portfolio-summary.service';
import {ForwardRisksView} from '@terminal-core-lib/features/portfolios/services/portfolio-summary-service.types';
import {BlotterWidgetSettings} from '@terminal-widgets-lib/widgets/blotter/widget-settings.types';
import {WidgetSettingsHelper} from '@terminal-core-lib/features/widget-settings/utils/widget-settings.helper';

@Component({
  selector: 'ats-blotter-forward-summary',
  templateUrl: './blotter-forward-summary.html',
  styleUrls: ['./blotter-forward-summary.less'],
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
export class BlotterForwardSummary implements OnInit {
  readonly shouldShowSettings = input<boolean>(false);

  readonly guid = input.required<string>();

  summary$!: Observable<ForwardRisksView>;

  readonly columns = signal(1);

  private readonly settingsService = inject(WidgetSettingsService);

  private readonly service = inject(PortfolioSummaryService);

  ngOnInit(): void {
    this.summary$ = this.settingsService.getSettings<BlotterWidgetSettings>(this.guid()).pipe(
      distinctUntilChanged((previous, current) => WidgetSettingsHelper.isEqualPortfolioDependedSettings(previous, current)),
      switchMap(settings => this.service.getForwardRisks(settings))
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
