import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OrdersBasketWidgetComponent} from './orders-basket-widget.component';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {EMPTY, of} from 'rxjs';
import {DashboardContextService} from '../../../../shared/services/dashboard-context.service';
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {MockComponents} from "ng-mocks";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";
import {OrdersBasketComponent} from "../../components/orders-basket/orders-basket.component";
import {OrdersBasketSettingsComponent} from "../../components/orders-basket-settings/orders-basket-settings.component";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";

describe('OrdersBasketWidgetComponent', () => {
  let component: OrdersBasketWidgetComponent;
  let fixture: ComponentFixture<OrdersBasketWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OrdersBasketWidgetComponent,
        TranslocoTestsModule.getModule(),
        MockComponents(
          WidgetSkeletonComponent,
          WidgetHeaderComponent,
          OrdersBasketComponent,
          OrdersBasketSettingsComponent
        )
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettingsOrNull: jasmine.createSpy('getSettingsOrNull').and.returnValue(of(null)),
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
            addSettings: jasmine.createSpy('addSettings').and.callThrough()
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(EMPTY),
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            instrumentsSelection$: of({})
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OrdersBasketWidgetComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      'widgetInstance',
      {
        instance: {
          guid: 'guid'
        } as Widget,
        widgetMeta: {widgetName: {}} as WidgetMeta
      }
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
