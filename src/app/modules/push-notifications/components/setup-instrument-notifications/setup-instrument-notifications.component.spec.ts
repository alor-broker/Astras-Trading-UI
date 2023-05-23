import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupInstrumentNotificationsComponent } from './setup-instrument-notifications.component';
import {
  commonTestProviders,
  getTranslocoModule, mockComponent,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";
import {PushNotificationsService} from "../../services/push-notifications.service";
import {Subject} from "rxjs";
import {NoopAnimationsModule} from "@angular/platform-browser/animations";

describe('SetupInstrumentNotificationsComponent', () => {
  let component: SetupInstrumentNotificationsComponent;
  let fixture: ComponentFixture<SetupInstrumentNotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        NoopAnimationsModule,
        ...sharedModuleImportForTests
      ],
      declarations: [
        SetupInstrumentNotificationsComponent,
        mockComponent({selector: 'nz-spin', inputs:['nzSpinning']})
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
