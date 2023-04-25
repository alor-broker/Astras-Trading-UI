import { TestBed } from '@angular/core/testing';

import { PushNotificationsService } from './push-notifications.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { AngularFireMessaging } from "@angular/fire/compat/messaging";
import { of } from "rxjs";
import { AuthService } from "../../../shared/services/auth.service";
import { Store } from "@ngrx/store";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";

describe('FirebaseNotificationsService', () => {
  let service: PushNotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: AngularFireMessaging,
          useValue: {
            requestToken: of('testToken')
          }
        },
        {
          provide: ErrorHandlerService,
          useValue: {}
        }
      ]
    });
    service = TestBed.inject(PushNotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
