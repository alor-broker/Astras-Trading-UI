import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
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

@Component({
  selector: 'ats-common-summary[guid]',
  templateUrl: './common-summary.component.html',
  styleUrls: ['./common-summary.component.less']
})
export class CommonSummaryComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  summary$: Observable<CommonSummaryView> = of();
  columns: number = 1;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly service: PortfolioSummaryService,
  ) {
  }

  ngOnInit(): void {
    this.summary$ = this.settingsService.getSettings<BlotterSettings>(this.guid).pipe(
      distinctUntilChanged((previous, current) => isEqualPortfolioDependedSettings(previous, current)),
      switchMap(settings => this.service.getCommonSummary(settings))
    );
  }

  containerSizeChanged(entries: ResizeObserverEntry[]) {
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
