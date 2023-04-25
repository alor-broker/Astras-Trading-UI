import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupInstrumentNotificationsComponent } from './setup-instrument-notifications.component';
import {
  commonTestProviders,
  getTranslocoModule, mockComponent,
  ngZorroMockComponents,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";
import {PushNotificationsService} from "../../services/push-notifications.service";
import {Subject} from "rxjs";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
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
