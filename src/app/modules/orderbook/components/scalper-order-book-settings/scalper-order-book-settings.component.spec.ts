import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ScalperOrderBookSettingsComponent } from './scalper-order-book-settings.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import {
  getTranslocoModule,
  mockComponent
} from "../../../../shared/utils/testing";

describe('ScalperOrderBookSettingsComponent', () => {
  let component: ScalperOrderBookSettingsComponent;
  let fixture: ComponentFixture<ScalperOrderBookSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ScalperOrderBookSettingsComponent,
        mockComponent({ selector: 'ats-instrument-board-select', inputs: ['symbol', 'placeholder'] })
      ],
      imports: [
        getTranslocoModule()
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({
              symbol: 'SBER',
              exchange: 'MOEX'
            })),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScalperOrderBookSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
