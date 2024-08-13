import { TestBed } from '@angular/core/testing';

import { RemoteStorageService } from './remote-storage.service';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {ErrorHandlerService} from "../handle-error/error-handler.service";
import { EnvironmentService } from "../environment.service";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('RemoteStorageService', () => {
  let service: RemoteStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
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
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});
    service = TestBed.inject(RemoteStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
