import {ComponentFixture, TestBed} from '@angular/core/testing';

import {SetupInstrumentNotificationsComponent} from './setup-instrument-notifications.component';
import {PushNotificationsService} from "../../services/push-notifications.service";
import {EMPTY, of, Subject} from "rxjs";
import {CommonParametersService} from "../../../order-commands/services/common-parameters.service";
import {QuotesService} from "../../../../shared/services/quotes.service";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzDividerComponent} from "ng-zorro-antd/divider";
import {InputNumberComponent} from "../../../../shared/components/input-number/input-number.component";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";

describe('SetupInstrumentNotificationsComponent', () => {
  let component: SetupInstrumentNotificationsComponent;
  let fixture: ComponentFixture<SetupInstrumentNotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        SetupInstrumentNotificationsComponent,
        ...FormsTesting.getMocks(),
        MockComponents(
          NzSpinComponent,
          NzButtonComponent,
          NzDividerComponent,
          InputNumberComponent,
          NzTypographyComponent,
        ),
        MockDirectives(
          NzIconDirective
        )
      ],
      providers: [
        {
          provide: PushNotificationsService,
          useValue: {
            subscriptionsUpdated$: new Subject(),
            cancelSubscription: jasmine.createSpy('cancelSubscription').and.returnValue(new Subject()),
            subscribeToPriceChange: jasmine.createSpy('subscribeToPriceChange').and.returnValue(new Subject()),
            getCurrentSubscriptions: jasmine.createSpy('getCurrentSubscriptions').and.returnValue(new Subject()),
            getBrowserNotificationsStatus: jasmine.createSpy('getBrowserNotificationsStatus').and.returnValue(new Subject()),
            getMessages: jasmine.createSpy('getMessages').and.returnValue(new Subject()),
          }
        },
        {
          provide: CommonParametersService,
          useValue: {
            parameters$: of({})
          }
        },
        {
          provide: QuotesService,
          useValue: {
            getLastPrice: jasmine.createSpy('getLastPrice').and.returnValue(EMPTY)
          }
        },
        {
          provide: InstrumentsService,
          useValue: {
            getInstrument: jasmine.createSpy('getInstrument').and.returnValue(EMPTY)
          }
        },
        ...commonTestProviders
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SetupInstrumentNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
