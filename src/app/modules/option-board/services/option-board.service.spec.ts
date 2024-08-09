import {TestBed} from '@angular/core/testing';

import {OptionBoardService} from './option-board.service';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {ErrorHandlerService} from "../../../shared/services/handle-error/error-handler.service";
import {CacheService} from "../../../shared/services/cache.service";
import {Subject} from "rxjs";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('OptionBoardService', () => {
  let service: OptionBoardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        OptionBoardService,
        {
            provide: ErrorHandlerService,
            useValue: {
                handleError: jasmine.createSpy('handleError').and.callThrough()
            }
        },
        {
            provide: CacheService,
            useValue: {
                wrap: jasmine.createSpy('wrap').and.returnValue(new Subject())
            }
        },
        {
            provide: EnvironmentService,
            useValue: {
                apiUrl: ''
            }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});
    service = TestBed.inject(OptionBoardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
