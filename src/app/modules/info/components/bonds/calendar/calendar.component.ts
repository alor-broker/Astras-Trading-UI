import {Component, input} from '@angular/core';
import {Bond} from "../../../../../../generated/graphql.types";
import {NzTableModule} from "ng-zorro-antd/table";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {CurrencyPipe, NgClass, PercentPipe} from "@angular/common";
import {TableRowHeightDirective} from "../../../../../shared/directives/table-row-height.directive";
import {isBefore} from "date-fns";

@Component({
  selector: 'ats-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.less'],
  imports: [
    NzTableModule,
    TranslocoDirective,
    NzEmptyComponent,
    NzTypographyComponent,
    CurrencyPipe,
    TableRowHeightDirective,
    NgClass,
    PercentPipe
  ]
})
export class CalendarComponent {
  readonly bond = input.required<Bond>();

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  isInPast(date: string): boolean {
    return isBefore(new Date(date), new Date());
  }
}
