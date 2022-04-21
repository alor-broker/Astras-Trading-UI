/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { OrderbookSettingsComponent } from './orderbook-settings.component';
import { of } from 'rxjs';
import { OrderbookService } from '../../services/orderbook.service';

describe('OrderbookSettingsComponent', () => {
  let component: OrderbookSettingsComponent;
  let fixture: ComponentFixture<OrderbookSettingsComponent>;
  const spy = jasmine.createSpyObj('OrderbookService', ['getSettings']);
  spy.getSettings.and.returnValue(of({
    symbol: 'SBER',
    exchange: 'MOEX'
  }));

  beforeEach((async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderbookSettingsComponent ],
      providers: [
        { provide: OrderbookService, useValue: spy }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderbookSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
