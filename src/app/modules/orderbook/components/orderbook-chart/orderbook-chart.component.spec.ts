/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { OrderbookChartComponent } from './orderbook-chart.component';
import { OrderbookService } from '../../services/orderbook.service';
import { of } from 'rxjs';

describe('OrderbookChartComponent', () => {
  let component: OrderbookChartComponent;
  let fixture: ComponentFixture<OrderbookChartComponent>;

  beforeEach((async () => {
    const spyOb = jasmine.createSpyObj('OrderbookService', ['getSettings']);
    spyOb.getSettings.and.returnValue(of({
      symbol: 'SBER',
      exchange: 'MOEX',
      showTable: true
    }));
    await TestBed.configureTestingModule({
      declarations: [ OrderbookChartComponent ],
      providers: [
        { provide: OrderbookService, useValue: spyOb },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderbookChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
