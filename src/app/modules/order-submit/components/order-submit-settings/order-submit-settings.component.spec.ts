import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { OrderSubmitSettingsComponent } from './order-submit-settings.component';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { of } from 'rxjs';
import { OrderSubmitModule } from '../../order-submit.module';
import {
  commonTestProviders,
  getTranslocoModule,
  mockComponent,
  sharedModuleImportForTests
} from '../../../../shared/utils/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OrderSubmitSettings } from '../../models/order-submit-settings.model';

describe('OrderSubmitSettingsComponent', () => {
  let component: OrderSubmitSettingsComponent;
  let fixture: ComponentFixture<OrderSubmitSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations:[
        mockComponent({ selector: 'ats-instrument-board-select', inputs: ['symbol', 'placeholder'] })
      ],
      imports: [
        OrderSubmitModule,
        ...sharedModuleImportForTests,
        NoopAnimationsModule,
        getTranslocoModule()
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({} as OrderSubmitSettings)),
            updateSettings: jasmine.createSpy('getSettings').and.callThrough(),
          }
        },
        ...commonTestProviders
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderSubmitSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
