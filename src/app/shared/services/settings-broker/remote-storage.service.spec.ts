import { TestBed } from '@angular/core/testing';

import { RemoteStorageService } from './remote-storage.service';
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ErrorHandlerService} from "../handle-error/error-handler.service";
import { EnvironmentService } from "../environment.service";

describe('RemoteStorageService', () => {
  let service: RemoteStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ErrorHandlerService,
          useValue: {
            handleError: jasmine.createSpy('handleError').and.callThrough()
          }
        },
        {
          provide: EnvironmentService,
          useValue: {
            remoteSettingsStorageUrl: ''
          }
        }
      ]
    });
    service = TestBed.inject(RemoteStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
