import { Component, OnInit, inject } from '@angular/core';
import {Observable} from "rxjs";
import {BaseColumnSettings} from "../../../../shared/models/settings/table-settings.model";
import {ArbitrageSpreadService} from "../../services/arbitrage-spread.service";
import {ArbitrageSpread} from "../../models/arbitrage-spread.model";
import {Side} from "../../../../shared/models/enums/side.model";
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
import {TableRowHeightDirective} from '../../../../shared/directives/table-row-height.directive';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzWaveDirective} from 'ng-zorro-antd/core/wave';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzFormControlComponent, NzFormItemComponent} from 'ng-zorro-antd/form';
import {InputNumberComponent} from '../../../../shared/components/input-number/input-number.component';
import {FormsModule} from '@angular/forms';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {AsyncPipe, DecimalPipe} from '@angular/common';

@Component({
  selector: 'ats-arbitrage-spread',
  templateUrl: './arbitrage-spread-table.component.html',
  styleUrls: ['./arbitrage-spread-table.component.less'],
  imports: [
    TranslocoDirective,
    NzTableComponent,
    TableRowHeightDirective,
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
    InputNumberComponent,
    FormsModule,
    NzEmptyComponent,
    AsyncPipe,
    DecimalPipe
  ]
})
export class ArbitrageSpreadTableComponent implements OnInit {
  private readonly service = inject(ArbitrageSpreadService);

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
