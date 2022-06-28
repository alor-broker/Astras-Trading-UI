import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  Observable,
  of,
  Subscription,
  switchMap
} from 'rxjs';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { SummaryView } from '../../models/summary-view.model';
import { BlotterService } from '../../services/blotter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterSettings } from "../../../../shared/models/settings/blotter-settings.model";

@Component({
  selector: 'ats-summaries[guid][resize]',
  templateUrl: './summaries.component.html',
  styleUrls: ['./summaries.component.less']
})
export class SummariesComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  summary$: Observable<SummaryView> = of();

  columns: number = 1;

  private resizeSub?: Subscription;

  constructor(private readonly settingsService: WidgetSettingsService, private readonly service: BlotterService) { }

  ngOnInit(): void {
    this.summary$ = this.settingsService.getSettings<BlotterSettings>(this.guid).pipe(
      switchMap(settings => this.service.getSummaries(settings))
    );

    this.resizeSub = this.resize.subscribe(i => {
      if (i.width) {
        if (i.width <= 600) {
          this.columns = 1;
        }
        else if (i.width < 900) {
          this.columns = 2;
        }
        else if (i.width < 1500) {
          this.columns = 3;
        }
        else {
          this.columns = 4;
        }
      }
    });
  }
}
