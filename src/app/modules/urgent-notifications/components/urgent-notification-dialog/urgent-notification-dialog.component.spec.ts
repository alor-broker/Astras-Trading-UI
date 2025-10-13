import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UrgentNotificationDialogComponent } from './urgent-notification-dialog.component';
import { MockProvider } from "ng-mocks";
import { UrgentNotificationsService } from "../../services/urgent-notifications.service";
import { EMPTY } from "rxjs";
import { LocalStorageService } from "../../../../shared/services/local-storage.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('UrgentNotificationDialogComponent', () => {
  let component: UrgentNotificationDialogComponent;
  let fixture: ComponentFixture<UrgentNotificationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UrgentNotificationDialogComponent,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(LocalStorageService),
        MockProvider(
          UrgentNotificationsService,
          {
            getNotifications: () => EMPTY
          }
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UrgentNotificationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
