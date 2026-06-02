import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation
} from '@angular/core';
import {isBefore} from 'date-fns';
import {Bond} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.types';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzTableModule} from 'ng-zorro-antd/table';
import {TableRowHeight} from '@terminal-core-lib/common/directives/table-row-height';
import {
  CurrencyPipe,
  PercentPipe
} from '@angular/common';

@Component({
  selector: 'ats-bond-calendar',
  imports: [
    TranslocoDirective,
    NzEmptyComponent,
    NzTypographyComponent,
    NzTableModule,
    TableRowHeight,
    CurrencyPipe,
    PercentPipe
  ],
  templateUrl: './bond-calendar.html',
  styleUrl: './bond-calendar.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BondCalendar {
  readonly bond = input.required<Bond>();

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  isInPast(date: string): boolean {
    return isBefore(new Date(date), new Date());
  }
}
