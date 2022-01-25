/* tslint:disable:no-unused-variable */

import { HttpClient } from '@angular/common/http';
import { TestBed, async, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HandleErrorService } from './handle-error.service';

describe('HandleErrorService: Register', () => {
  let service: HandleErrorService;

  const notificationSpy = jasmine.createSpyObj('NzNotificationService', ['success', 'error', 'blank'])

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: NzNotificationService, useValue: notificationSpy }
      ],
    });
    service = TestBed.inject(HandleErrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
