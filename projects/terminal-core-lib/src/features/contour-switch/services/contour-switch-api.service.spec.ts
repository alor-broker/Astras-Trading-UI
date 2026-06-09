import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import {firstValueFrom} from 'rxjs';
import {CORE_API_URL_PROVIDER} from '../../../config/api-url-providers';
import {
  ContourActivationResultStatus,
  ContourErrorCode,
  ContourState
} from '../types/contour-switch.types';
import {ContourSwitchApiService} from './contour-switch-api.service';

describe('ContourSwitchApiService', () => {
  let service: ContourSwitchApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: CORE_API_URL_PROVIDER, useValue: {apiUrl: 'https://api.test'}},
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ContourSwitchApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should get the current contour status', async () => {
    const resultPromise = firstValueFrom(service.getStatus());

    const req = httpTestingController.expectOne('https://api.test/client/contour');
    expect(req.request.method).toBe('GET');
    req.flush({state: ContourState.Inactive});

    await expect(resultPromise).resolves.toEqual({state: ContourState.Inactive});
  });

  it('should return null when status check fails', async () => {
    const resultPromise = firstValueFrom(service.getStatus());

    const req = httpTestingController.expectOne('https://api.test/client/contour');
    req.flush({code: ContourErrorCode.ContourStateUnavailable, message: 'error'}, {
      status: 503,
      statusText: 'Service Unavailable'
    });

    await expect(resultPromise).resolves.toBeNull();
  });

  it('should activate the current contour', async () => {
    const resultPromise = firstValueFrom(service.activateCurrentContour());

    const req = httpTestingController.expectOne('https://api.test/client/contour/actions/activate');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush({state: ContourState.Active});

    await expect(resultPromise).resolves.toEqual({
      status: ContourActivationResultStatus.Success,
      response: {state: ContourState.Active}
    });
  });

  it('should return a contour error result when activation fails', async () => {
    const resultPromise = firstValueFrom(service.activateCurrentContour());

    const req = httpTestingController.expectOne('https://api.test/client/contour/actions/activate');
    req.flush({
      code: ContourErrorCode.SwitchCooldown,
      message: 'error',
      retryAfterSec: 42
    }, {
      status: 409,
      statusText: 'Conflict'
    });

    await expect(resultPromise).resolves.toEqual({
      status: ContourActivationResultStatus.Error,
      error: {
        code: ContourErrorCode.SwitchCooldown,
        message: 'error',
        retryAfterSec: 42
      }
    });
  });
});
