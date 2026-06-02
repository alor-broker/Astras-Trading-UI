import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation
} from '@angular/core';
import {Dividend} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.types';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzTableModule} from 'ng-zorro-antd/table';
import {TableRowHeight} from '@terminal-core-lib/common/directives/table-row-height';
import {
  CurrencyPipe,
  PercentPipe
} from '@angular/common';

@Component({
  selector: 'ats-dividends',
  imports: [
    NzEmptyComponent,
    TranslocoDirective,
    NzTableModule,
    CurrencyPipe,
    PercentPipe,
    TableRowHeight
  ],
  templateUrl: './dividends.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dividends {
  readonly dividends = input<Dividend[]>([]);

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
}
