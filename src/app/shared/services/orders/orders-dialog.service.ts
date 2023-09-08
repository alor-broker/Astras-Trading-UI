import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from "rxjs";
import {EditOrderDialogParams, OrderDialogParams} from "../../models/orders/orders-dialog.model";

@Injectable({
  providedIn: 'root'
})
export class OrdersDialogService {
  private readonly newOrderParams$ = new BehaviorSubject<OrderDialogParams | null>(null);
  private readonly editOrderDialogParams$ = new BehaviorSubject<EditOrderDialogParams | null>(null);

  constructor() {
  }

  get newOrderDialogParameters$(): Observable<OrderDialogParams | null> {
    return this.newOrderParams$.asObservable();
  }

  get editOrderDialogParameters$(): Observable<EditOrderDialogParams | null> {
    return this.editOrderDialogParams$.asObservable();
  }

  openNewOrderDialog(params: OrderDialogParams) {
    this.newOrderParams$.next(params);
  }

  closeNewOrderDialog() {
    this.newOrderParams$.next(null);
  }

  openEditOrderDialog(params: EditOrderDialogParams) {
    this.editOrderDialogParams$.next(params);
  }

  closeEditOrderDialog() {
    this.editOrderDialogParams$.next(null);
  }
}
