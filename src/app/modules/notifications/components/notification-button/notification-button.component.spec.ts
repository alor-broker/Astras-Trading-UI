import {ComponentFixture, TestBed} from '@angular/core/testing';

import {NotificationButtonComponent} from './notification-button.component';
import {NotificationsService} from "../../services/notifications.service";
import {of} from "rxjs";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzBadgeComponent} from "ng-zorro-antd/badge";
import {NzPopoverDirective} from "ng-zorro-antd/popover";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NotificationsListComponent} from "../notifications-list/notifications-list.component";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";

describe('NotificationButtonComponent', () => {
  let component: NotificationButtonComponent;
  let fixture: ComponentFixture<NotificationButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotificationButtonComponent,
        TranslocoTestsModule.getModule(),
        MockComponents(
          NzBadgeComponent,
          NzButtonComponent,
          NotificationsListComponent
        ),
        MockDirectives(
          NzPopoverDirective,
          NzIconDirective
        )
      ],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            getNotifications: jasmine.createSpy('getNotifications').and.returnValue(of([]))
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
