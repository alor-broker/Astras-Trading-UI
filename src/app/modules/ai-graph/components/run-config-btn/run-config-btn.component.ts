import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {GraphConfig} from "../../models/graph.model";
import {GraphProcessingContextService} from "../../services/graph-processing-context.service";
import {asyncScheduler, subscribeOn, toArray} from "rxjs";
import {LiteGraphRunner} from "../../graph/lite-graph-runner";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {RunStatus, Status} from '../../models/run-results.model';

@Component({
  selector: 'ats-run-config-btn',
  standalone: true,
  imports: [
    NzButtonComponent,
    NzIconDirective
  ],
  templateUrl: './run-config-btn.component.html',
  styleUrl: './run-config-btn.component.less'
})
export class RunConfigBtnComponent implements OnInit {
  @Input()
  config: GraphConfig | null = null;

  @Output()
  status = new EventEmitter<RunStatus>();

  readonly Statuses = Status;
  protected currentStatus: RunStatus = {
    status: Status.Initial,
    results: []
  };

  constructor(
    private readonly graphProcessingContextService: GraphProcessingContextService,
    private readonly cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    this.setStatus({
      status: Status.Initial,
      results: []
    });
  }

  protected run(): void {
    if (this.config == null) {
      return;
    }

    this.setStatus({
      status: Status.Loading,
      results: []
    });

    LiteGraphRunner.run(this.config, this.graphProcessingContextService).pipe(
      toArray(),
      subscribeOn(asyncScheduler)
    ).subscribe(x => {
      console.log(x);
      const results = x.filter(i => i.outputFormat != null && i.nodeData != null)
        .map(i => ({
          format: i.outputFormat!,
          source: i.nodeTitle,
          result: i.nodeData!
        }));

      this.setStatus({
        status: Status.Success,
        results
      });

      this.cdr.markForCheck();
    });
  }

  private setStatus(status: RunStatus): void {
    this.currentStatus = status;
    this.status.emit(this.currentStatus);
  }
}
