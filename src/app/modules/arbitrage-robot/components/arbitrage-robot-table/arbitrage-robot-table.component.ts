import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Observable } from "rxjs";
import { ArbitrageRobot, TradeDirection } from "../../models/arbitrage-robot.model";
import { ArbitrageRobotService } from "../../services/arbitrage-robot.service";
import { RobotEngineService } from "../../services/robot-engine.service";
import { NzModalService } from 'ng-zorro-antd/modal';
import {
  NzTableComponent, NzTheadComponent, NzTbodyComponent,
  NzTrDirective, NzTableCellDirective, NzThMeasureDirective, NzCellAlignDirective
} from 'ng-zorro-antd/table';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzWaveDirective } from 'ng-zorro-antd/core/wave';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { NzSwitchComponent } from 'ng-zorro-antd/switch';
import { NzFormControlComponent, NzFormItemComponent } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { InputNumberComponent } from '../../../../shared/components/input-number/input-number.component';
import { NzEmptyComponent } from 'ng-zorro-antd/empty';
import { TableRowHeightDirective } from '../../../../shared/directives/table-row-height.directive';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'ats-arbitrage-robot-table',
  templateUrl: './arbitrage-robot-table.component.html',
  styleUrls: ['./arbitrage-robot-table.component.less'],
  imports: [
    NzTableComponent, NzTheadComponent, NzTbodyComponent,
    NzTrDirective, NzTableCellDirective, NzThMeasureDirective, NzCellAlignDirective,
    TableRowHeightDirective,
    NzButtonComponent, NzWaveDirective,
    NzIconDirective, NzTooltipDirective,
    NzSwitchComponent,
    NzFormItemComponent, NzFormControlComponent,
    NzSelectModule,
    InputNumberComponent,
    NzEmptyComponent,
    AsyncPipe, DecimalPipe, FormsModule
  ]
})
export class ArbitrageRobotTableComponent implements OnInit, OnDestroy {
  private readonly service = inject(ArbitrageRobotService);
  private readonly modal = inject(NzModalService);
  readonly engine = inject(RobotEngineService);

  readonly TradeDirection = TradeDirection;

  readonly directionOptions = [
    { label: 'Все', value: TradeDirection.All },
    { label: 'Покупка', value: TradeDirection.Buy },
    { label: 'Продажа', value: TradeDirection.Sell },
  ];

  items$?: Observable<ArbitrageRobot[]>;
  getAbs = Math.abs;

  ngOnInit(): void {
    this.items$ = this.service.getSpreadsSubscription();
  }

  ngOnDestroy(): void {
    this.engine.ngOnDestroy();
  }

  addSpread(): void {
    this.service.openModal();
  }

  editSpread(spread: ArbitrageRobot): void {
    this.service.openModal(spread);
  }

  removeSpread(spread: ArbitrageRobot): void {
    this.engine.stop(spread.id!);
    this.service.removeSpread(spread.id!);
  }

  onToggle(spread: ArbitrageRobot, enable: boolean): void {
    if (enable) {
      this.tryEnable(spread);
    } else {
      this.tryDisable(spread);
    }
  }

  updateConfig(spread: ArbitrageRobot, patch: Partial<ArbitrageRobot['robotConfig']>): void {
    this.service.updateRobotConfig(spread.id!, patch);
  }

  trackByFn(index: number, spread: ArbitrageRobot): string {
    return spread.id!;
  }

  private tryEnable(spread: ArbitrageRobot): void {
    if (this.service.hasOpenPositions(spread)) {
      const names = this.service.getOpenPositionNames(spread);
      this.modal.warning({
        nzTitle: 'Нельзя включить робота',
        nzContent: `Есть открытые позиции: ${names}. Закройте их перед запуском.`,
        nzOkText: 'Понятно',
      });
      return;
    }

    this.engine.start(spread);
    this.service.updateRobotConfig(spread.id!, { isEnabled: true });
  }

  private tryDisable(spread: ArbitrageRobot): void {
    this.engine.stop(spread.id!);
    this.service.updateRobotConfig(spread.id!, { isEnabled: false });

    if (this.service.hasOpenPositions(spread)) {
      const names = this.service.getOpenPositionNames(spread);
      this.modal.confirm({
        nzTitle: 'Робот остановлен',
        nzContent: `Есть открытые позиции: ${names}. Закрыть их по рынку?`,
        nzOkText: 'Закрыть позиции',
        nzOkType: 'primary',
        nzOkDanger: false,
        nzCancelText: 'Не закрывать',
        nzOnOk: () => this.service.closePositions(spread).subscribe(),
      });
    }
  }
}
