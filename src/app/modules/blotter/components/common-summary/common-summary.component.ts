import { Component, OnInit, input, output, inject } from '@angular/core';
import {
  distinctUntilChanged,
  Observable,
  of,
  switchMap
} from 'rxjs';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { isEqualPortfolioDependedSettings } from "../../../../shared/utils/settings-helper";
import { BlotterSettings } from '../../models/blotter-settings.model';
import {PortfolioSummaryService} from "../../../../shared/services/portfolio-summary.service";
import {CommonSummaryView} from "../../../../shared/models/common-summary-view.model";
import { NzResizeObserverDirective } from 'ng-zorro-antd/cdk/resize-observer';
import { TranslocoDirective } from '@jsverse/transloco';
import { NzDescriptionsComponent, NzDescriptionsItemComponent } from 'ng-zorro-antd/descriptions';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'ats-common-summary',
    templateUrl: './common-summary.component.html',
    styleUrls: ['./common-summary.component.less'],
    imports: [
      NzResizeObserverDirective,
      TranslocoDirective,
      NzDescriptionsComponent,
      NzDescriptionsItemComponent,
      AsyncPipe
    ]
})
export class CommonSummaryComponent implements OnInit {
  private readonly settingsService = inject(WidgetSettingsService);
  private readonly service = inject(PortfolioSummaryService);

  readonly shouldShowSettings = input.required<boolean>();

  readonly guid = input.required<string>();

  readonly shouldShowSettingsChange = output<boolean>();

  summary$: Observable<CommonSummaryView> = of();
  columns = 1;

  ngOnInit(): void {
    this.summary$ = this.settingsService.getSettings<BlotterSettings>(this.guid()).pipe(
      distinctUntilChanged((previous, current) => isEqualPortfolioDependedSettings(previous, current)),
      switchMap(settings => this.service.getCommonSummary(settings))
    );
  }

  containerSizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      const width = Math.floor(x.contentRect.width);
      if (width <= 600) {
        this.columns = 1;
      }
      else if (width < 900) {
        this.columns = 2;
      }
      else if (width < 1500) {
        this.columns = 3;
      }
      else {
        this.columns = 4;
      }
    });
  }
}
