import {TestBed} from '@angular/core/testing';
import {
  Observable,
  of,
  Subject
} from 'rxjs';
import {ContourActivationDialog} from './contour-activation-dialog';
import {
  ContourActivationDialogMessage,
  ContourActivationDialogService
} from '../../services/contour-activation-dialog.service';
import {
  ContourActivationResult,
  ContourActivationResultStatus,
  ContourErrorCode,
  ContourErrorResponse,
  ContourState
} from '../../types/contour-switch.types';

interface DialogAccessor {
  isVisible: () => boolean;
  message: () => ContourActivationDialogMessage;
  resultStatus: () => 'warning' | 'error' | 'success';
  isActivationLoading: () => boolean;
  cooldownSeconds: () => number | null;
  isActionDisabled: () => boolean;
  isActionVisible: () => boolean;
  activateCurrentContour(): void;
  close(): void;
}

describe('ContourActivationDialog', () => {
  let component: DialogAccessor;
  let showDialogSubject: Subject<void>;
  let dialogService: {
    showDialog$: Observable<void>;
    activateCurrentContour: ReturnType<typeof vi.fn>;
  };

  function activationError(
    code: ContourErrorCode,
    extra: Partial<{ retryAfterSec: number }> = {}
  ): ContourActivationResult {
    return {
      status: ContourActivationResultStatus.Error,
      error: {
        code,
        message: 'error',
        ...extra
      } as ContourErrorResponse
    };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    showDialogSubject = new Subject<void>();
    dialogService = {
      showDialog$: showDialogSubject.asObservable(),
      activateCurrentContour: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [
        ContourActivationDialog
      ],
      providers: [
        {provide: ContourActivationDialogService, useValue: dialogService}
      ]
    });
    TestBed.overrideComponent(ContourActivationDialog, {
      set: {
        template: ''
      }
    });

    component = TestBed.createComponent(ContourActivationDialog).componentInstance as unknown as DialogAccessor;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show the initial blocked dialog when requested by the service', () => {
    showDialogSubject.next();

    expect(component.isVisible()).toBe(true);
    expect(component.message()).toBe(ContourActivationDialogMessage.TradingBlocked);
    expect(component.resultStatus()).toBe('warning');
    expect(component.isActionDisabled()).toBe(false);
    expect(component.isActionVisible()).toBe(true);
  });

  it('should show activated state when activation succeeds', () => {
    showDialogSubject.next();
    dialogService.activateCurrentContour.mockReturnValue(of({
      status: ContourActivationResultStatus.Success,
      response: {state: ContourState.Active}
    }));

    component.activateCurrentContour();

    expect(component.message()).toBe(ContourActivationDialogMessage.ContourActivated);
    expect(component.resultStatus()).toBe('success');
    expect(component.isActionDisabled()).toBe(true);
    expect(component.isActionVisible()).toBe(false);
  });

  it('should disable action while activation request is pending', () => {
    const activationResultSubject = new Subject<ContourActivationResult>();

    showDialogSubject.next();
    dialogService.activateCurrentContour.mockReturnValue(activationResultSubject.asObservable());

    component.activateCurrentContour();

    expect(component.isActivationLoading()).toBe(true);
    expect(component.isActionDisabled()).toBe(true);
    expect(component.isActionVisible()).toBe(true);

    activationResultSubject.next({
      status: ContourActivationResultStatus.Success,
      response: {state: ContourState.Active}
    });

    expect(component.isActivationLoading()).toBe(false);
    expect(component.isActionVisible()).toBe(false);
  });

  it('should keep action disabled until switch cooldown expires', () => {
    showDialogSubject.next();
    dialogService.activateCurrentContour.mockReturnValue(of(activationError(ContourErrorCode.SwitchCooldown, {retryAfterSec: 2})));

    component.activateCurrentContour();

    expect(component.cooldownSeconds()).toBe(2);
    expect(component.resultStatus()).toBe('error');
    expect(component.isActionDisabled()).toBe(true);
    expect(component.isActionVisible()).toBe(true);

    vi.advanceTimersByTime(1000);

    expect(component.cooldownSeconds()).toBe(1);
    expect(component.isActionDisabled()).toBe(true);

    vi.advanceTimersByTime(1000);

    expect(component.cooldownSeconds()).toBeNull();
    expect(component.message()).toBe(ContourActivationDialogMessage.TradingBlocked);
    expect(component.resultStatus()).toBe('warning');
    expect(component.isActionDisabled()).toBe(false);
  });

  it('should map ContourSwitchDisabled to activation unavailable state', () => {
    showDialogSubject.next();
    dialogService.activateCurrentContour.mockReturnValue(of(activationError(ContourErrorCode.ContourSwitchDisabled)));

    component.activateCurrentContour();

    expect(component.message()).toBe(ContourActivationDialogMessage.ActivationUnavailable);
    expect(component.resultStatus()).toBe('error');
    expect(component.isActionDisabled()).toBe(true);
  });

  it.each([
    ContourErrorCode.ContourStateUnavailable,
    ContourErrorCode.ContourProjectionUnavailable
  ])('should map %s to trading unavailable state', code => {
    showDialogSubject.next();
    dialogService.activateCurrentContour.mockReturnValue(of(activationError(code)));

    component.activateCurrentContour();

    expect(component.message()).toBe(ContourActivationDialogMessage.TradingUnavailable);
    expect(component.resultStatus()).toBe('error');
    expect(component.isActionDisabled()).toBe(true);
  });

  it('should map unknown activation errors to activation failed state', () => {
    showDialogSubject.next();
    dialogService.activateCurrentContour.mockReturnValue(of({
      status: ContourActivationResultStatus.Error,
      error: null
    }));

    component.activateCurrentContour();

    expect(component.message()).toBe(ContourActivationDialogMessage.ActivationFailed);
    expect(component.resultStatus()).toBe('error');
    expect(component.isActionDisabled()).toBe(true);
  });
});
