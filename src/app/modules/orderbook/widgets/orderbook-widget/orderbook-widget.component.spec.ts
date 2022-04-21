import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WidgetNames } from 'src/app/shared/models/enums/widget-names';
import { OrderbookService } from '../../services/orderbook.service';

import { OrderbookWidgetComponent } from './orderbook-widget.component';

const settings = {
  symbol: 'SBER',
  exchange: 'MOEX'
};

describe('OrderbookWidgetComponent', () => {
  let component: OrderbookWidgetComponent;
  let fixture: ComponentFixture<OrderbookWidgetComponent>;
  const spyOb = jasmine.createSpyObj('OrderbookService', ['settings$', 'setSettings']);
  spyOb.settings$ = of(settings);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderbookWidgetComponent ],
    })
    .compileComponents();

    TestBed.overrideComponent(OrderbookWidgetComponent, {
      set: {
        providers: [
          { provide: OrderbookService, useValue: spyOb }
        ]
      }});
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderbookWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
