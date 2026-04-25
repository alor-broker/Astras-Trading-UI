import { Component, OnInit, inject } from '@angular/core';
import { Observable, of, take } from "rxjs";
import { ArbitrageRobotService } from "../../services/arbitrage-robot.service";
import { ArbitrageRobot } from "../../models/arbitrage-robot.model";
import { NzModalComponent, NzModalContentDirective, NzModalFooterDirective } from 'ng-zorro-antd/modal';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzWaveDirective } from 'ng-zorro-antd/core/wave';
import { AsyncPipe } from '@angular/common';
import { ArbitrageRobotManageComponent } from '../../components/arbitrage-robot-manage/arbitrage-robot-manage.component';

@Component({
  selector: 'ats-arbitrage-robot-modal-widget',
  templateUrl: './arbitrage-robot-modal-widget.component.html',
  imports: [
    NzModalComponent,
    NzModalContentDirective,
    NzModalFooterDirective,
    NzButtonComponent,
    NzWaveDirective,
    AsyncPipe,
    ArbitrageRobotManageComponent
  ]
})
export class ArbitrageRobotModalWidgetComponent implements OnInit {
  private readonly service = inject(ArbitrageRobotService);

  isVisible$: Observable<boolean> = of(false);
  spreadInfo$: Observable<ArbitrageRobot | null> = of(null);
  formData: { value: ArbitrageRobot, isValid: boolean } | null = null;

  ngOnInit(): void {
    this.isVisible$ = this.service.shouldShowModal$;
    this.spreadInfo$ = this.service.modalParams$;
  }

  handleCancel(): void {
    this.formData = null;
    this.service.closeModal();
  }

  formChange(data: { value: ArbitrageRobot, isValid: boolean }): void {
    this.formData = data;
  }

  addOrEdit(): void {
    this.spreadInfo$.pipe(take(1)).subscribe(existing => {
      if (existing) {
        this.service.editSpread(this.formData!.value);
      } else {
        this.service.addSpread(this.formData!.value);
      }
      this.handleCancel();
    });
  }
}
