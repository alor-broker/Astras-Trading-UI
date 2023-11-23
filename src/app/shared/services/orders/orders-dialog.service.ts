import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from "rxjs";
import {EditOrderDialogParams, OrderDialogParams} from "../../models/orders/orders-dialog.model";

@Injectable({
  providedIn: 'root'
})
export class OrdersDialogService {
  private readonly newOrderParams$ = new BehaviorSubject<OrderDialogParams | null>(null);
  private readonly editOrderDialogParams$ = new BehaviorSubject<EditOrderDialogParams | null>(null);

  get newOrderDialogParameters$(): Observable<OrderDialogParams | null> {
    return this.newOrderParams$.asObservable();
  }

  get editOrderDialogParameters$(): Observable<EditOrderDialogParams | null> {
    return this.editOrderDialogParams$.asObservable();
  }

  openNewOrderDialog(params: OrderDialogParams): void {
    this.newOrderParams$.next(params);
  }

  closeNewOrderDialog(): void {
    this.newOrderParams$.next(null);
  }

  openEditOrderDialog(params: EditOrderDialogParams): void {
    this.editOrderDialogParams$.next(params);
  }

  closeEditOrderDialog(): void {
    this.editOrderDialogParams$.next(null);
  }
}
