import {
  Component,
  input
} from '@angular/core';
import {
  NzTableModule
} from "ng-zorro-antd/table";
import { Dividend } from "../../../../../../generated/graphql.types";
import { TableRowHeightDirective } from "../../../../../shared/directives/table-row-height.directive";
import {
  CurrencyPipe,
  PercentPipe
} from "@angular/common";
import { NzEmptyComponent } from "ng-zorro-antd/empty";
import { TranslocoDirective } from "@jsverse/transloco";

@Component({
    selector: 'ats-dividends',
    templateUrl: './dividends.component.html',
    styleUrls: ['./dividends.component.less'],
    imports: [
        NzTableModule,
        TableRowHeightDirective,
        CurrencyPipe,
        PercentPipe,
        NzEmptyComponent,
        TranslocoDirective
    ]
})
export class DividendsComponent {
  readonly dividends = input<Dividend[]>([]);

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
}
