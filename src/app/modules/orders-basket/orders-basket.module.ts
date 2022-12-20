import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersBasketWidgetComponent } from './widgets/orders-basket-widget/orders-basket-widget.component';
import { OrdersBasketComponent } from './components/orders-basket/orders-basket.component';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { OrdersBasketItemComponent } from './components/orders-basket-item/orders-basket-item.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { SharedModule } from '../../shared/shared.module';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';



@NgModule({
  declarations: [
    OrdersBasketComponent,
    OrdersBasketWidgetComponent,
    OrdersBasketItemComponent
  ],
    imports: [
        CommonModule,
        NzEmptyModule,
        FormsModule,
        ReactiveFormsModule,
        NzButtonModule,
        NzIconModule,
        NzFormModule,
        NzInputModule,
        SharedModule,
        NzInputNumberModule
    ],
  exports: [
    OrdersBasketWidgetComponent
  ]
})
export class OrdersBasketModule { }
