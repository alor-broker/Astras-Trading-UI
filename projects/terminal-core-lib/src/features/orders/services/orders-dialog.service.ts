import {
  Injectable,
  signal
} from '@angular/core';
import {
  EditOrderDialogParams,
  OrderDialogParams,
  OrdersDialogOptions
} from './orders-dialog-service.types';
import {toObservable} from "@angular/core/rxjs-interop";

@Injectable()
export class OrdersDialogService {
  private readonly newOrderParams = signal<OrderDialogParams | null>(null);

  readonly newOrderDialogParameters$ = toObservable(this.newOrderParams);

  private readonly editOrderDialogParams = signal<EditOrderDialogParams | null>(null);

  readonly editOrderDialogParameters$ = toObservable(this.editOrderDialogParams);

  private currentDialogOptions: OrdersDialogOptions = {
    isNewOrderDialogSupported: true
  };

  get dialogOptions(): OrdersDialogOptions {
    return {
      ...this.currentDialogOptions
    };
  }

  openNewOrderDialog(params: OrderDialogParams): void {
    this.newOrderParams.set(params);
  }

  closeNewOrderDialog(): void {
    this.newOrderParams.set(null);
  }

  openEditOrderDialog(params: EditOrderDialogParams): void {
    this.editOrderDialogParams.set(params);
  }

  closeEditOrderDialog(): void {
    this.editOrderDialogParams.set(null);
  }

  setDialogOptions(options: OrdersDialogOptions): void {
    this.currentDialogOptions = options;
  }
}
