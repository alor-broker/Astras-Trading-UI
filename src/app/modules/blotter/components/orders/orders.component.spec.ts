import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalService } from 'src/app/shared/services/modal.service';
import { OrderCancellerService } from 'src/app/shared/services/order-canceller.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { BlotterService } from '../../services/blotter.service';
import { MockServiceBlotter } from '../../utils/mock-blotter-service';

import { OrdersComponent } from './orders.component';
import { StoreModule } from "@ngrx/store";

describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;

  beforeEach(async () => {
    const modalSpy = jasmine.createSpyObj('ModalService', ['closeCommandModal']);
    const cancelSpy = jasmine.createSpyObj('OrderCancellerService', ['cancelOrder']);
    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        StoreModule.forRoot({})
      ],
      providers: [
        { provide: BlotterService, useClass: MockServiceBlotter },
        { provide: ModalService, useValue: modalSpy },
        { provide: OrderCancellerService, useValue: cancelSpy },
      ],
      declarations: [ OrdersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
