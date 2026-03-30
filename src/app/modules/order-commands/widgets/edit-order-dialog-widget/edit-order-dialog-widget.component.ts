import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {CommonParameters, CommonParametersService} from "../../services/common-parameters.service";
import {BehaviorSubject, Observable, shareReplay, take} from "rxjs";
import {PortfolioKey} from "../../../../shared/models/portfolio-key.model";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {filter, finalize, map} from "rxjs/operators";
import {OrderFormState} from "../../models/order-form.model";
import {OrderFormType} from "../../../../shared/models/orders/orders-dialog.model";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";
import {ConfirmableOrderCommandsService} from "../../services/confirmable-order-commands.service";
import {TranslocoDirective} from '@jsverse/transloco';
import {LetDirective} from '@ngrx/component';
import {NzModalComponent, NzModalContentDirective} from 'ng-zorro-antd/modal';
import {InstrumentInfoComponent} from '../../components/instrument-info/instrument-info.component';
import {
  EditLimitOrderFormComponent
} from '../../components/order-forms/edit-limit-order-form/edit-limit-order-form.component';
import {
  EditStopOrderFormComponent
} from '../../components/order-forms/edit-stop-order-form/edit-stop-order-form.component';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-edit-order-dialog-widget',
  templateUrl: './edit-order-dialog-widget.component.html',
  styleUrls: ['./edit-order-dialog-widget.component.less'],
  providers: [
    CommonParametersService,
    ConfirmableOrderCommandsService
  ],
  imports: [
    TranslocoDirective,
    LetDirective,
    NzModalComponent,
    NzModalContentDirective,
    InstrumentInfoComponent,
    EditLimitOrderFormComponent,
    EditStopOrderFormComponent,
    NzTypographyComponent,
    NzButtonComponent,
    NzIconDirective,
    AsyncPipe
  ]
})
export class EditOrderDialogWidgetComponent implements OnInit, OnDestroy {
  private readonly ordersDialogService = inject(OrdersDialogService);
  private readonly commonParametersService = inject(CommonParametersService);

  readonly formState$ = new BehaviorSubject<OrderFormState | null>(null);
  readonly busy$ = new BehaviorSubject<boolean>(false);
  readonly orderTypes = OrderFormType;
  readonly dialogParams$ = this.ordersDialogService.editOrderDialogParameters$;
  currentPortfolio$!: Observable<PortfolioKey>;
  currentInstrument$!: Observable<InstrumentKey>;

  cancelEditing(): void {
    this.dialogParams$.pipe(
      take(1)
    ).subscribe(p => {
      p?.cancelCallback?.();
      this.closeDialog();
    });
  }

  closeDialog(): void {
    this.ordersDialogService.closeEditOrderDialog();
  }

  setCommonParameters(params: Partial<CommonParameters>): void {
    this.commonParametersService.setParameters(params);
  }

  ngOnInit(): void {
    this.currentPortfolio$ = this.dialogParams$.pipe(
      filter(p => !!p),
      map(p => p!.portfolioKey),
      shareReplay(1)
    );

    this.currentInstrument$ = this.dialogParams$.pipe(
      filter(p => !!p),
      map(p => p!.instrumentKey),
      shareReplay(1)
    );
  }

  submit(): void {
    this.formState$.pipe(
      filter(s => !!s?.submit),
      take(1)
    ).subscribe(s => {
      this.busy$.next(true);
      s?.submit?.().pipe(
        take(1),
        finalize(() => this.busy$.next(false)),
      ).subscribe(r => {
        this.busy$.next(false);
        if (r) {
          this.closeDialog();
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.formState$.complete();
    this.busy$.complete();
  }
}
