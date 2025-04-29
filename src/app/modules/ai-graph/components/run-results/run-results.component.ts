import {Component, Input} from '@angular/core';
import {OutputFormat} from "../../graph/nodes/models";
import {MarkdownComponent} from "ngx-markdown";
import {RunStatus, Status} from "../../models/run-results.model";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {TranslocoDirective} from "@jsverse/transloco";

@Component({
    selector: 'ats-run-results',
    imports: [
        MarkdownComponent,
        NzEmptyComponent,
        TranslocoDirective
    ],
    templateUrl: './run-results.component.html',
    styleUrl: './run-results.component.less'
})
export class RunResultsComponent {
  readonly Formats = OutputFormat;

  @Input({required: true})
  runStatus: RunStatus | null = null;

  readonly Statuses = Status;
}
