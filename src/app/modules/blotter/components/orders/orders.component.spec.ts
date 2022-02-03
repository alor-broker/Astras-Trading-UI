import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';
import { OrderCancellerService } from 'src/app/shared/services/order-canceller.service';
import { SyncService } from 'src/app/shared/services/sync.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { BlotterService } from '../../services/blotter.service';
import { MockServiceBlotter } from '../../utils/mock-blotter-service';

import { OrdersComponent } from './orders.component';

describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;

  beforeEach(async () => {
    const syncSpy = jasmine.createSpyObj('SyncService', ['closeCommandModal']);
    const cancelSpy = jasmine.createSpyObj('OrderCancellerService', ['cancelOrder']);
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: [
        { provide: BlotterService, useClass: MockServiceBlotter },
        { provide: SyncService, useValue: syncSpy },
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
