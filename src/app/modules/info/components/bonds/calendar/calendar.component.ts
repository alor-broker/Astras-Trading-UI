import {
  Component,
  Input
} from '@angular/core';
import { Bond } from "../../../../../../generated/graphql.types";
import { NzTableModule } from "ng-zorro-antd/table";
import { TranslocoDirective } from "@jsverse/transloco";
import { NzEmptyComponent } from "ng-zorro-antd/empty";
import { NzTypographyComponent } from "ng-zorro-antd/typography";
import {
  CurrencyPipe
} from "@angular/common";
import { TableRowHeightDirective } from "../../../../../shared/directives/table-row-height.directive";

@Component({
  selector: 'ats-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.less'],
  standalone: true,
  imports: [
    NzTableModule,
    TranslocoDirective,
    NzEmptyComponent,
    NzTypographyComponent,
    CurrencyPipe,
    TableRowHeightDirective
  ]
})
export class CalendarComponent {
  @Input({required: true})
  bond!: Bond;

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
}
