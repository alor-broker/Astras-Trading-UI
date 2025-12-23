import { Component, OnInit, input, inject } from '@angular/core';
import {
  distinctUntilChanged,
  Observable,
  switchMap
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { isEqualPortfolioDependedSettings } from "../../../../shared/utils/settings-helper";
import { BlotterSettings } from '../../models/blotter-settings.model';
import {PortfolioSummaryService} from "../../../../shared/services/portfolio-summary.service";
import {ForwardRisksView} from "../../../../shared/models/forward-risks-view.model";
import { NzResizeObserverDirective } from 'ng-zorro-antd/cdk/resize-observer';
import { TranslocoDirective } from '@jsverse/transloco';
import { NzDescriptionsComponent, NzDescriptionsItemComponent } from 'ng-zorro-antd/descriptions';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'ats-forward-summary',
    templateUrl: './forward-summary.component.html',
    styleUrls: ['./forward-summary.component.less'],
    imports: [
      NzResizeObserverDirective,
      TranslocoDirective,
      NzDescriptionsComponent,
      NzDescriptionsItemComponent,
      AsyncPipe
    ]
})
export class ForwardSummaryComponent implements OnInit {
  private readonly settingsService = inject(WidgetSettingsService);
  private readonly service = inject(PortfolioSummaryService);

  readonly shouldShowSettings = input<boolean>(false);

  readonly guid = input.required<string>();

  summary$!: Observable<ForwardRisksView>;
  columns = 1;

  ngOnInit(): void {
    this.summary$ = this.settingsService.getSettings<BlotterSettings>(this.guid()).pipe(
      distinctUntilChanged((previous, current) => isEqualPortfolioDependedSettings(previous, current)),
      switchMap(settings => this.service.getForwardRisks(settings))
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
