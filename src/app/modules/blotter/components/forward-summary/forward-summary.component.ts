import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import {
  distinctUntilChanged,
  Observable,
  switchMap
} from "rxjs";
import { BlotterService } from "../../services/blotter.service";
import { ForwardRisksView } from "../../models/forward-risks-view.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { isEqualPortfolioDependedSettings } from "../../../../shared/utils/settings-helper";
import { BlotterSettings } from '../../models/blotter-settings.model';

@Component({
  selector: 'ats-forward-summary[guid]',
  templateUrl: './forward-summary.component.html',
  styleUrls: ['./forward-summary.component.less']
})
export class ForwardSummaryComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  summary$!: Observable<ForwardRisksView>;
  columns: number = 1;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly service: BlotterService,
  ) {
  }

  ngOnInit(): void {
    this.summary$ = this.settingsService.getSettings<BlotterSettings>(this.guid).pipe(
      distinctUntilChanged((previous, current) => isEqualPortfolioDependedSettings(previous, current)),
      switchMap(settings => this.service.getForwardRisks(settings))
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
