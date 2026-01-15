import { ChangeDetectorRef, Component, OnInit, input, output, inject } from '@angular/core';
import {GraphConfig} from "../../models/graph.model";
import {GraphProcessingContextService} from "../../services/graph-processing-context.service";
import {asyncScheduler, subscribeOn, toArray} from "rxjs";
import {LiteGraphRunner} from "../../graph/lite-graph-runner";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {RunStatus, Status} from '../../models/run-results.model';

@Component({
    selector: 'ats-run-config-btn',
    imports: [
        NzButtonComponent,
        NzIconDirective
    ],
    templateUrl: './run-config-btn.component.html',
    styleUrl: './run-config-btn.component.less'
})
export class RunConfigBtnComponent implements OnInit {
  private readonly graphProcessingContextService = inject(GraphProcessingContextService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly config = input<GraphConfig | null>(null);

  readonly status = output<RunStatus>();

  readonly Statuses = Status;
  protected currentStatus: RunStatus = {
    status: Status.Initial,
    results: []
  };

  ngOnInit(): void {
    this.setStatus({
      status: Status.Initial,
      results: []
    });
  }

  protected run(): void {
    const config = this.config();
    if (config == null) {
      return;
    }

    this.setStatus({
      status: Status.Loading,
      results: []
    });

    LiteGraphRunner.run(config, this.graphProcessingContextService).pipe(
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
