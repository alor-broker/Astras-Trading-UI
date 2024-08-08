import { TestBed } from '@angular/core/testing';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HttpErrorHandler } from "./http-error-handler";

describe('HttpErrorHandler', () => {
  let service: HttpErrorHandler;

  const notificationSpy = jasmine.createSpyObj('NzNotificationService', ['success', 'error', 'blank']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: NzNotificationService, useValue: notificationSpy },
        HttpErrorHandler
      ],
    });
    service = TestBed.inject(HttpErrorHandler);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
