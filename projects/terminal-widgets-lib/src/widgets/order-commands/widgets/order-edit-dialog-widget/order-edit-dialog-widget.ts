import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {OrdersDialogService} from '@terminal-core-lib/features/orders/services/orders-dialog.service';
import {
  CommonParameters,
  CommonParametersService
} from "../../services/common-parameters.service";
import {
  BehaviorSubject,
  Observable,
  shareReplay,
  take
} from "rxjs";
import {OrderFormState} from '@terminal-widgets-lib/widgets/order-commands/types/order-form.types';
import {OrderFormType} from "@terminal-core-lib/features/orders/services/orders-dialog-service.types";
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {
  filter,
  finalize,
  map
} from 'rxjs/operators';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {
  NzModalComponent,
  NzModalContentDirective
} from 'ng-zorro-antd/modal';
import {LetDirective} from '@ngrx/component';
import {InstrumentInfo} from '@terminal-widgets-lib/widgets/order-commands/components/instrument-info/instrument-info';
import {EditLimitOrderForm} from '@terminal-widgets-lib/widgets/order-commands/components/order-forms/edit-limit-order-form/edit-limit-order-form';
import {EditStopOrderForm} from '@terminal-widgets-lib/widgets/order-commands/components/order-forms/edit-stop-order-form/edit-stop-order-form';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzButtonComponent} from 'ng-zorro-antd/button';

@Component({
  selector: 'ats-order-edit-dialog-widget',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    NzModalComponent,
    LetDirective,
    NzModalContentDirective,
    InstrumentInfo,
    EditLimitOrderForm,
    EditStopOrderForm,
    NzTypographyComponent,
    NzIconDirective,
    NzButtonComponent
  ],
  templateUrl: './order-edit-dialog-widget.html',
  styleUrl: './order-edit-dialog-widget.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CommonParametersService]
})
export class OrderEditDialogWidget implements OnInit, OnDestroy {
  readonly formState$ = new BehaviorSubject<OrderFormState | null>(null);

  readonly busy$ = new BehaviorSubject<boolean>(false);

  readonly orderTypes = OrderFormType;

  currentPortfolio$!: Observable<PortfolioKey>;

  currentInstrument$!: Observable<InstrumentKey>;

  private readonly ordersDialogService = inject(OrdersDialogService);

  readonly dialogParams$ = this.ordersDialogService.editOrderDialogParameters$;

  private readonly commonParametersService = inject(CommonParametersService);

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
