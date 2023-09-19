import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersBasketSettingsComponent } from './orders-basket-settings.component';
import {
  commonTestProviders,
  getTranslocoModule,
  mockComponent,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { OrderSubmitSettings } from "../../../order-commands/models/order-submit-settings.model";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe('OrdersBasketSettingsComponent', () => {
  let component: OrdersBasketSettingsComponent;
  let fixture: ComponentFixture<OrdersBasketSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        ...sharedModuleImportForTests,
        NoopAnimationsModule
      ],
      declarations: [
        OrdersBasketSettingsComponent
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
    });
    fixture = TestBed.createComponent(OrdersBasketSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
