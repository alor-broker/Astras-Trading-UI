import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { OrderSubmitSettingsComponent } from './order-submit-settings.component';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { of } from 'rxjs';
import { TechChartSettings } from '../../../../shared/models/settings/tech-chart-settings.model';
import { OrderSubmitModule } from '../../order-submit.module';
import { sharedModuleImportForTests } from '../../../../shared/utils/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('OrderSubmitSettingsComponent', () => {
  let component: OrderSubmitSettingsComponent;
  let fixture: ComponentFixture<OrderSubmitSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OrderSubmitModule,
        ...sharedModuleImportForTests,
        NoopAnimationsModule
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({} as TechChartSettings)),
            updateSettings: jasmine.createSpy('getSettings').and.callThrough(),
          }
        }
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
