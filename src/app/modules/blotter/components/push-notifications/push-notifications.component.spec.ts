import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PushNotificationsComponent } from './push-notifications.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {Subject} from "rxjs";
import {BlotterService} from "../../services/blotter.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {TerminalSettingsService} from "../../../terminal-settings/services/terminal-settings.service";
import {PushNotificationsService} from "../../../push-notifications/services/push-notifications.service";
import {getTranslocoModule} from "../../../../shared/utils/testing";

describe('PushNotificationsComponent', () => {
  let component: PushNotificationsComponent;
  let fixture: ComponentFixture<PushNotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[getTranslocoModule()],
      declarations: [ PushNotificationsComponent ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: BlotterService,
          useValue: {
            selectNewInstrument: jasmine.createSpy('selectNewInstrument').and.callThrough(),
            getPositions: jasmine.createSpy('getPositions').and.returnValue(new Subject())
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            instrumentsSelection$: new Subject()
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: PushNotificationsService,
          useValue: {
            cancelSubscription: jasmine.createSpy('cancelSubscription').and.returnValue(new Subject()),
            subscriptionsUpdated$: new Subject(),
            getMessages: jasmine.createSpy('getMessages').and.returnValue(new Subject()),
            getCurrentSubscriptions: jasmine.createSpy('getCurrentSubscriptions').and.returnValue(new Subject())
          }
        },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PushNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
