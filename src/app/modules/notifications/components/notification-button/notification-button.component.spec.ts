import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationButtonComponent } from './notification-button.component';
import { ngZorroMockComponents } from '../../../../shared/utils/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { NotificationsService } from "../../services/notifications.service";
import { of } from "rxjs";

describe('NotificationButtonComponent', () => {
  let component: NotificationButtonComponent;
  let fixture: ComponentFixture<NotificationButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        NotificationButtonComponent,
        ...ngZorroMockComponents
      ],
      imports:[
        NoopAnimationsModule,
        NzDropDownModule
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
