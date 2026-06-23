import {TestBed} from '@angular/core/testing';
import {
  firstValueFrom,
  of
} from 'rxjs';
import {
  ContourActivationResult,
  ContourActivationResultStatus,
  ContourState
} from '../types/contour-switch.types';
import {ContourActivationDialogService} from './contour-activation-dialog.service';
import {ContourSwitchApiService} from './contour-switch-api.service';

describe('ContourActivationDialogService', () => {
  let service: ContourActivationDialogService;
  let apiService: {
    getStatus: ReturnType<typeof vi.fn>;
    activateCurrentContour: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    apiService = {
      getStatus: vi.fn(),
      activateCurrentContour: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        {provide: ContourSwitchApiService, useValue: apiService}
      ]
    });

    service = TestBed.inject(ContourActivationDialogService);
  });

  it('should emit show dialog event when the current contour is inactive', async () => {
    apiService.getStatus.mockReturnValue(of({state: ContourState.Inactive}));
    const showDialogPromise = firstValueFrom(service.showDialog$);

    await firstValueFrom(service.checkStatus());

    await expect(showDialogPromise).resolves.toBeUndefined();
  });

  it('should not emit show dialog event when status check fails', async () => {
    apiService.getStatus.mockReturnValue(of(null));
    const showDialog = vi.fn();
    const subscription = service.showDialog$.subscribe(showDialog);

    await firstValueFrom(service.checkStatus());

    expect(showDialog).not.toHaveBeenCalled();
    subscription.unsubscribe();
  });

  it('should return the activation result from the API service', async () => {
    const activationResult: ContourActivationResult = {
      status: ContourActivationResultStatus.Success,
      response: {state: ContourState.Active}
    };
    apiService.activateCurrentContour.mockReturnValue(of(activationResult));

    const result = await firstValueFrom(service.activateCurrentContour());

    expect(result).toEqual(activationResult);
  });
});
