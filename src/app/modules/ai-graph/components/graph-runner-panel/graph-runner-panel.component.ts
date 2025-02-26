import {ChangeDetectorRef, Component, Input} from '@angular/core';
import {GraphConfig} from "../../models/graph.model";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {LiteGraphRunner} from "../../editor/lite-graph-runner";
import {toArray} from "rxjs";
import {GraphProcessingContextService} from "../../services/graph-processing-context.service";
import {OutputFormat} from "../../editor/nodes/models";
import {MarkdownComponent} from "ngx-markdown";

interface GraphResult {
  format: OutputFormat;
  source: string;
  result: unknown;
}

@Component({
  selector: 'ats-graph-runner-panel',
  standalone: true,
  imports: [
    NzButtonComponent,
    NzIconDirective,
    MarkdownComponent
  ],
  templateUrl: './graph-runner-panel.component.html',
  styleUrl: './graph-runner-panel.component.less'
})
export class GraphRunnerPanelComponent {
  @Input()
  config: GraphConfig | null = null;

  isLoading = false;
  result: GraphResult[] = [];

  readonly Formats = OutputFormat;
  constructor(
    private readonly graphProcessingContextService: GraphProcessingContextService,
    private readonly cdr: ChangeDetectorRef
  ) {
  }

  run(): void {
    if (this.config == null) {
      return;
    }

    this.isLoading = true;
    this.result = [];

    LiteGraphRunner.run(this.config, this.graphProcessingContextService).pipe(
      toArray(),
    ).subscribe(x => {
      this.isLoading = false;
      console.log(x);

      this.result = x.filter(i => i.outputFormat != null && i.nodeData != null)
        .map(i => ({
          format: i.outputFormat!,
          source: i.nodeTitle,
          result: i.nodeData!
        }));

      this.cdr.detectChanges();
    });
  }
}
