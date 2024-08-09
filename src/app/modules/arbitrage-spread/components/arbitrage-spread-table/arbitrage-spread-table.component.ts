import { Component, OnInit } from '@angular/core';
import { Observable } from "rxjs";
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import { ArbitrageSpreadService } from "../../services/arbitrage-spread.service";
import { ArbitrageSpread } from "../../models/arbitrage-spread.model";
import { Side } from "../../../../shared/models/enums/side.model";

@Component({
  selector: 'ats-arbitrage-spread',
  templateUrl: './arbitrage-spread-table.component.html',
  styleUrls: ['./arbitrage-spread-table.component.less']
})
export class ArbitrageSpreadTableComponent implements OnInit {
  items$?: Observable<ArbitrageSpread[]>;

  tableInnerWidth = 1000;

  volumes: Record<string, number> = {};

  listOfColumns: BaseColumnSettings<ArbitrageSpread>[] = [
    { id: 'symbols', displayName: 'Инструменты', width: 140 },
    { id: 'buySpread', displayName: 'Рыночная раздвижка на покупку', width: 100 },
    { id: 'sellSpread', displayName: 'Рыночная раздвижка на продажу', width: 100 },
    { id: 'volume', displayName: 'Объём заявки', width: 60 },
    { id: 'operation', displayName: 'Операция', width: 140 },
  ];

  constructor(
    private readonly service: ArbitrageSpreadService,
  ) {
  }

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

  getAbs = Math.abs;

  volumeChange(value: number, spreadId: string): void {
    this.volumes[spreadId] = value;
  }

  trackByFn(index: number, spread: ArbitrageSpread): string {
    return spread.id!;
  }
}
