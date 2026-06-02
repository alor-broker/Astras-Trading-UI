import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {Observable} from "rxjs";
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzCellAlignDirective,
  NzTableCellDirective,
  NzTableComponent,
  NzTbodyComponent,
  NzTheadComponent,
  NzThMeasureDirective,
  NzTrDirective
} from 'ng-zorro-antd/table';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzWaveDirective} from 'ng-zorro-antd/core/wave';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {
  NzColDirective,
  NzRowDirective
} from 'ng-zorro-antd/grid';
import {
  NzFormControlComponent,
  NzFormItemComponent
} from 'ng-zorro-antd/form';
import {FormsModule} from '@angular/forms';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {
  AsyncPipe,
  DecimalPipe
} from '@angular/common';
import {ArbitrageSpreadService} from '@terminal-widgets-lib/widgets/arbitrage-spread/services/arbitrage-spread.service';
import {ArbitrageSpread} from '@terminal-widgets-lib/widgets/arbitrage-spread/types/arbitrage-spread.types';
import {BaseColumnSettings} from '@terminal-core-lib/features/tables/types/table-display-settings.types';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {TableRowHeight} from '@terminal-core-lib/common/directives/table-row-height';
import {InputNumber} from '@terminal-core-lib/common/components/input-number/input-number';

@Component({
  selector: 'ats-arbitrage-spread-table',
  templateUrl: './arbitrage-spread-table.html',
  styleUrls: ['./arbitrage-spread-table.less'],
  imports: [
    TranslocoDirective,
    NzTableComponent,
    NzTheadComponent,
    NzTrDirective,
    NzTableCellDirective,
    NzThMeasureDirective,
    NzCellAlignDirective,
    NzButtonComponent,
    NzWaveDirective,
    NzTooltipDirective,
    NzIconDirective,
    NzTbodyComponent,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormControlComponent,
    FormsModule,
    NzEmptyComponent,
    AsyncPipe,
    DecimalPipe,
    TableRowHeight,
    InputNumber
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ArbitrageSpreadTable implements OnInit {
  items$?: Observable<ArbitrageSpread[]>;

  tableInnerWidth = 1000;

  volumes: Record<string, number> = {};

  listOfColumns: BaseColumnSettings<ArbitrageSpread>[] = [
    {id: 'symbols', displayName: 'Инструменты', width: 140},
    {id: 'buySpread', displayName: 'Рыночная раздвижка на покупку', width: 100},
    {id: 'sellSpread', displayName: 'Рыночная раздвижка на продажу', width: 100},
    {id: 'volume', displayName: 'Объём заявки', width: 60},
    {id: 'operation', displayName: 'Операция', width: 140},
  ];

  getAbs = Math.abs;

  private readonly service = inject(ArbitrageSpreadService);

  ngOnInit(): void {
    this.items$ = this.service.getSpreadsSubscription();
  }

  addSpread(): void {
    this.service.openSpreadModal();
  }

  editSpread(spread: ArbitrageSpread): void {
    this.service.openSpreadModal(spread);
  }

  removeSpread(spreadId: string): void {
    this.service.removeSpread(spreadId);
  }

  buySpread(spread: ArbitrageSpread): void {
    const volume = this.volumes[spread.id!];

    this.service.buySpread(spread, volume)
      .subscribe();
  }

  sellSpread(spread: ArbitrageSpread): void {
    const volume = this.volumes[spread.id!];

    this.service.buySpread(spread, volume, Side.Sell)
      .subscribe();
  }

  isVolumeValid(spreadId: string): boolean {
    return !!this.volumes[spreadId];
  }

  volumeChange(value: number, spreadId: string): void {
    this.volumes[spreadId] = value;
  }

  trackByFn(index: number, spread: ArbitrageSpread): string {
    return spread.id!;
  }
}
