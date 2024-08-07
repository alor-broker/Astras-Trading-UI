import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PushNotificationsComponent } from './push-notifications.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { Subject } from "rxjs";
import { BlotterService } from "../../services/blotter.service";
import { PushNotificationsService } from "../../../push-notifications/services/push-notifications.service";
import {
  getTranslocoModule,
  mockComponent
} from "../../../../shared/utils/testing";
import { LetDirective } from "@ngrx/component";
import { ErrorHandlerService } from "../../../../shared/services/handle-error/error-handler.service";
import { NzContextMenuService } from "ng-zorro-antd/dropdown";

describe('PushNotificationsComponent', () => {
  let component: PushNotificationsComponent;
  let fixture: ComponentFixture<PushNotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[
        getTranslocoModule(),
        LetDirective
      ],
      declarations: [
        PushNotificationsComponent,
        mockComponent({
          selector: 'ats-add-to-watchlist-menu'
        })
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject()),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
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
          provide: PushNotificationsService,
          useValue: {
            cancelSubscription: jasmine.createSpy('cancelSubscription').and.returnValue(new Subject()),
            subscriptionsUpdated$: new Subject(),
            getMessages: jasmine.createSpy('getMessages').and.returnValue(new Subject()),
            getCurrentSubscriptions: jasmine.createSpy('getCurrentSubscriptions').and.returnValue(new Subject()),
            getBrowserNotificationsStatus: jasmine.createSpy('getBrowserNotificationsStatus').and.returnValue(new Subject())
          }
        },
        {
          provide: ErrorHandlerService,
          useValue: {
            handleError: jasmine.createSpy('handleError').and.callThrough()
          }
        },
        {
          provide: NzContextMenuService,
          useValue: {
            create: jasmine.createSpy('create').and.callThrough(),
            close: jasmine.createSpy('close').and.callThrough()
          }
        }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PushNotificationsComponent);
    component = fixture.componentInstance;
    component.guid = 'testGuid';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
