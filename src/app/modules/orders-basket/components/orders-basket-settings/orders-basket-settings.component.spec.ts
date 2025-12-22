import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OrdersBasketSettingsComponent} from './orders-basket-settings.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {of} from "rxjs";
import {OrderSubmitSettings} from "../../../order-commands/models/order-submit-settings.model";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {MockComponents} from "ng-mocks";
import {NzSwitchComponent} from "ng-zorro-antd/switch";
import {WidgetSettingsComponent} from "../../../../shared/components/widget-settings/widget-settings.component";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('OrdersBasketSettingsComponent', () => {
  let component: OrdersBasketSettingsComponent;
  let fixture: ComponentFixture<OrdersBasketSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        WidgetSettingsComponent,
        OrdersBasketSettingsComponent,
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        MockComponents(
          NzSwitchComponent
        )
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
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
