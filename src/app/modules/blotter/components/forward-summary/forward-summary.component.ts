import {
  Component,
  EventEmitter,
  Input,
  OnInit
} from '@angular/core';
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";
import {
  Observable,
  Subscription
} from "rxjs";
import { BlotterService } from "../../services/blotter.service";
import { ForwardRisksView } from "../../models/forward-risks-view.model";

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

  constructor(private service: BlotterService) {
  }

  ngOnInit(): void {
    this.summary$ = this.service.getForwardRisks(this.guid);

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
