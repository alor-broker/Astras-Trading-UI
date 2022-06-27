import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExchangeRateComponent } from './exchange-rate.component';
import { ExchangeRateService } from "../../services/exchange-rate.service";
import { of } from "rxjs";

describe('ExchangeRateComponent', () => {
  let component: ExchangeRateComponent;
  let fixture: ComponentFixture<ExchangeRateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExchangeRateComponent ],
    })
    .compileComponents();

    TestBed.overrideComponent(ExchangeRateComponent, {
      set: {
        providers: [{
          provide: ExchangeRateService,
          useValue: {
            getCurrencies: jasmine.createSpy('getCurrencies').and.returnValue(of([])),
            getQuotes: jasmine.createSpy('getQuotes').and.returnValue(of({})),
            unsubscribe: jasmine.createSpy('unsubscribe')
          }
        }]
      }
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExchangeRateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
