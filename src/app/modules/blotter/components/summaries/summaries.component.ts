import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable, of, Subscription } from 'rxjs';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { SummaryView } from '../../models/summary-view.model';
import { BlotterService } from '../../services/blotter.service';

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
  constructor(private service: BlotterService) { }

  ngOnInit(): void {
    this.summary$ = this.service.getSummaries(this.guid);
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
