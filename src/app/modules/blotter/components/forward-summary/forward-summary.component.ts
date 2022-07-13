import {
  Component,
  EventEmitter,
  Input,
  OnInit
} from '@angular/core';
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";
import {
  distinctUntilChanged,
  Observable,
  Subscription,
  switchMap
} from "rxjs";
import { BlotterService } from "../../services/blotter.service";
import { ForwardRisksView } from "../../models/forward-risks-view.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterSettings } from "../../../../shared/models/settings/blotter-settings.model";
import { isEqualBlotterSettings } from "../../../../shared/utils/settings-helper";

@Component({
  selector: 'ats-forward-summary[guid][resize]',
  templateUrl: './forward-summary.component.html',
  styleUrls: ['./forward-summary.component.less']
})
export class ForwardSummaryComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  resize!: EventEmitter<DashboardItem>;

  summary$!: Observable<ForwardRisksView>;

  columns: number = 1;

  private resizeSub?: Subscription;

  constructor(private readonly settingsService: WidgetSettingsService, private readonly service: BlotterService) {
  }

  ngOnInit(): void {
    this.summary$ = this.settingsService.getSettings<BlotterSettings>(this.guid).pipe(
      distinctUntilChanged((previous, current) => isEqualBlotterSettings(previous, current)),
      switchMap(settings => this.service.getForwardRisks(settings))
    );

    this.resizeSub = this.resize.subscribe(i => {
      if (i.width) {
        if (i.width <= 600) {
          this.columns = 1;
        } else if (i.width < 900) {
          this.columns = 2;
        } else if (i.width < 1500) {
          this.columns = 3;
        } else {
          this.columns = 4;
        }
      }
    });
  }
}
