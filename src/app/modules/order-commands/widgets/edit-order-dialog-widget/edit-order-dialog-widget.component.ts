import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonParameters, CommonParametersService} from "../../services/common-parameters.service";
import {BehaviorSubject, Observable, shareReplay, take} from "rxjs";
import {PortfolioKey} from "../../../../shared/models/portfolio-key.model";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {filter, map} from "rxjs/operators";
import {OrderFormState} from "../../models/order-form.model";
import {OrderType} from "../../../../shared/models/orders/orders-dialog.model";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";

@Component({
  selector: 'ats-edit-order-dialog-widget',
  templateUrl: './edit-order-dialog-widget.component.html',
  styleUrls: ['./edit-order-dialog-widget.component.less'],
  providers: [CommonParametersService]
})
export class EditOrderDialogWidgetComponent implements OnInit, OnDestroy {
  readonly formState$ = new BehaviorSubject<OrderFormState | null>(null);
  readonly busy$ = new BehaviorSubject<boolean>(false);
  readonly orderTypes = OrderType;
  readonly dialogParams$ = this.ordersDialogService.editOrderDialogParameters$;
  currentPortfolio$!: Observable<PortfolioKey>;
  currentInstrument$!: Observable<InstrumentKey>;

  constructor(
    private readonly ordersDialogService: OrdersDialogService,
    private readonly commonParametersService: CommonParametersService
  ) {
  }

  cancelEditing() {
    this.dialogParams$.pipe(
      take(1)
    ).subscribe(p => {
      p?.cancelCallback?.();
      this.closeDialog();
    });
  }

  closeDialog() {
    this.ordersDialogService.closeEditOrderDialog();
  }

  setCommonParameters(params: Partial<CommonParameters>) {
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

  submit() {
    this.formState$.pipe(
      filter(s => !!s?.submit),
      take(1)
    ).subscribe(s => {
      this.busy$.next(true);
      s?.submit?.().pipe(
        take(1)
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
