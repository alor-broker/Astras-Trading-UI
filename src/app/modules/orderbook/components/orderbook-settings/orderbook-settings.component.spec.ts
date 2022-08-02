import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { OrderbookSettingsComponent } from './orderbook-settings.component';
import { of } from 'rxjs';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { ReactiveFormsModule } from "@angular/forms";
import { NzSwitchModule } from "ng-zorro-antd/switch";
import { ngZorroMockComponents } from "../../../../shared/utils/testing";

describe('OrderbookSettingsComponent', () => {
  let component: OrderbookSettingsComponent;
  let fixture: ComponentFixture<OrderbookSettingsComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach((async () => {
    await TestBed.configureTestingModule({
      declarations: [
        OrderbookSettingsComponent,
        ...ngZorroMockComponents
      ],
      imports: [
        ReactiveFormsModule,
        NzSwitchModule
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
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderbookSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
