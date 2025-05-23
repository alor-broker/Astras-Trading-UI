import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonParameters, CommonParametersService} from "../../services/common-parameters.service";
import {BehaviorSubject, Observable, shareReplay, take} from "rxjs";
import {PortfolioKey} from "../../../../shared/models/portfolio-key.model";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {
  filter,
  finalize,
  map
} from "rxjs/operators";
import {OrderFormState} from "../../models/order-form.model";
import {OrderFormType} from "../../../../shared/models/orders/orders-dialog.model";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";
import {ConfirmableOrderCommandsService} from "../../services/confirmable-order-commands.service";

@Component({
    selector: 'ats-edit-order-dialog-widget',
    templateUrl: './edit-order-dialog-widget.component.html',
    styleUrls: ['./edit-order-dialog-widget.component.less'],
    providers: [
        CommonParametersService,
        ConfirmableOrderCommandsService
    ],
    standalone: false
})
export class EditOrderDialogWidgetComponent implements OnInit, OnDestroy {
  readonly formState$ = new BehaviorSubject<OrderFormState | null>(null);
  readonly busy$ = new BehaviorSubject<boolean>(false);
  readonly orderTypes = OrderFormType;
  readonly dialogParams$ = this.ordersDialogService.editOrderDialogParameters$;
  currentPortfolio$!: Observable<PortfolioKey>;
  currentInstrument$!: Observable<InstrumentKey>;

  constructor(
    private readonly ordersDialogService: OrdersDialogService,
    private readonly commonParametersService: CommonParametersService
  ) {
  }

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
