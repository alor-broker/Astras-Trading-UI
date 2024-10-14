import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { OrderSubmitSettingsComponent } from './order-submit-settings.component';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { of } from 'rxjs';
import { OrderSubmitSettings } from '../../models/order-submit-settings.model';
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { InstrumentBoardSelectMockComponent } from "../../../../shared/utils/testing/instrument-board-select-mock-component";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { FormsTesting } from "../../../../shared/utils/testing/forms-testing";
import { WidgetSettingsComponent } from "../../../../shared/components/widget-settings/widget-settings.component";
import { InstrumentSearchMockComponent } from "../../../../shared/utils/testing/instrument-search-mock-component";

describe('OrderSubmitSettingsComponent', () => {
  let component: OrderSubmitSettingsComponent;
  let fixture: ComponentFixture<OrderSubmitSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations:[
        OrderSubmitSettingsComponent,
      ],
      imports: [
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getTestingModules(),
        WidgetSettingsComponent,
        InstrumentBoardSelectMockComponent,
        InstrumentSearchMockComponent,
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({} as OrderSubmitSettings)),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough(),
          }
        },
        {
          provide: ManageDashboardsService,
          useValue: {
            copyWidget: jasmine.createSpy('copyWidget').and.callThrough(),
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
