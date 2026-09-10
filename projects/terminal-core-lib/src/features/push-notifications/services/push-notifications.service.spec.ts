import {provideHttpClient} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {
  firstValueFrom,
  of,
  skip,
  Subject
} from 'rxjs';
import {CORE_API_URL_PROVIDER} from '@terminal-core-lib/config/api-url-providers';
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';
import {PUSH_NOTIFICATIONS_CONNECTOR} from '@terminal-core-lib/features/push-notifications/types/push-notifications-connector.types';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {PushMessage} from '@terminal-core-lib/features/push-notifications/types/push-notifications.types';
import {PushNotificationsService} from './push-notifications.service';

describe('PushNotificationsService', () => {
  const apiUrl = 'https://api.test';
  const subscriptionsUrl = `${apiUrl}/commandapi/observatory/subscriptions`;

  let service: PushNotificationsService;
  let httpMock: HttpTestingController;
  let messagesSubject: Subject<PushMessage>;

  function waitForRefreshTrigger(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve));
  }

  beforeEach(() => {
    messagesSubject = new Subject<PushMessage>();

    TestBed.configureTestingModule({
      providers: [
        PushNotificationsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide: CORE_API_URL_PROVIDER, useValue: {apiUrl}},
        {
          provide: PUSH_NOTIFICATIONS_CONNECTOR,
          useValue: {
            getMessagingState: vi.fn().mockReturnValue(of({permission: 'granted', swToken: 'token'})),
            getMessages: vi.fn().mockReturnValue(messagesSubject)
          }
        },
        {provide: TranslatorService, useValue: {getActiveLang: vi.fn().mockReturnValue('en')}},
        {provide: ErrorHandlerService, useValue: {handleError: vi.fn()}}
      ]
    });

    service = TestBed.inject(PushNotificationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    messagesSubject.complete();
    vi.restoreAllMocks();
    httpMock.verify();
  });

  it('should share a current subscriptions request between concurrent consumers', async () => {
    const firstSubscriptionsPromise = firstValueFrom(service.getCurrentSubscriptions());
    const secondSubscriptionsPromise = firstValueFrom(service.getCurrentSubscriptions());

    await waitForRefreshTrigger();
    httpMock.expectOne(`${subscriptionsUrl}/actions/addToken`).flush({message: 'success'});

    const subscriptionsRequest = httpMock.expectOne(subscriptionsUrl);
    expect(subscriptionsRequest.request.method).toBe('GET');
    subscriptionsRequest.flush([]);

    await expect(firstSubscriptionsPromise).resolves.toEqual([]);
    await expect(secondSubscriptionsPromise).resolves.toEqual([]);
  });

  it('should refresh current subscriptions after cancelling a subscription', async () => {
    vi.useFakeTimers();

    try {
      const initialSubscriptionsPromise = firstValueFrom(service.getCurrentSubscriptions());

      vi.advanceTimersByTime(0);
      httpMock.expectOne(`${subscriptionsUrl}/actions/addToken`).flush({message: 'success'});
      httpMock.expectOne(subscriptionsUrl).flush([]);
      await initialSubscriptionsPromise;

      const refreshedSubscriptionsPromise = firstValueFrom(service.getCurrentSubscriptions().pipe(skip(1)));
      const cancellationPromise = firstValueFrom(service.cancelSubscription('subscription-id'));
      httpMock.expectOne(`${subscriptionsUrl}/subscription-id`).flush({message: 'success'});
      await cancellationPromise;
      TestBed.tick();

      vi.advanceTimersByTime(999);
      httpMock.expectNone(subscriptionsUrl);

      vi.advanceTimersByTime(1);
      httpMock.expectOne(subscriptionsUrl).flush([]);

      await expect(refreshedSubscriptionsPromise).resolves.toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should refresh subscriptions five seconds after the latest push message', async () => {
    vi.useFakeTimers();

    try {
      const initialSubscriptionsPromise = firstValueFrom(service.getCurrentSubscriptions());

      vi.advanceTimersByTime(0);
      httpMock.expectOne(`${subscriptionsUrl}/actions/addToken`).flush({message: 'success'});
      httpMock.expectOne(subscriptionsUrl).flush([]);
      await initialSubscriptionsPromise;

      const refreshedSubscriptionsPromise = firstValueFrom(service.getCurrentSubscriptions().pipe(skip(1)));
      messagesSubject.next({messageId: 'message-id-1', title: 'Title', body: 'Body'});
      messagesSubject.next({messageId: 'message-id-2', title: 'Title', body: 'Body'});
      messagesSubject.next({messageId: 'message-id-3', title: 'Title', body: 'Body'});

      vi.advanceTimersByTime(4_999);
      httpMock.expectNone(subscriptionsUrl);

      vi.advanceTimersByTime(1);
      httpMock.expectOne(subscriptionsUrl).flush([]);

      await expect(refreshedSubscriptionsPromise).resolves.toEqual([]);

      messagesSubject.next({messageId: 'message-id-4', title: 'Title', body: 'Body'});
      vi.advanceTimersByTime(500);
      messagesSubject.next({messageId: 'message-id-5', title: 'Title', body: 'Body'});
      vi.advanceTimersByTime(4_999);
      httpMock.expectNone(subscriptionsUrl);

      vi.advanceTimersByTime(1);
      httpMock.expectOne(subscriptionsUrl).flush([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should pause refresh while the document is hidden and refresh when it becomes visible', async () => {
    vi.useFakeTimers();

    try {
      const documentHiddenSpy = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
      const initialSubscriptionsPromise = firstValueFrom(service.getCurrentSubscriptions());

      vi.advanceTimersByTime(0);
      httpMock.expectOne(`${subscriptionsUrl}/actions/addToken`).flush({message: 'success'});
      httpMock.expectOne(subscriptionsUrl).flush([]);
      await initialSubscriptionsPromise;

      documentHiddenSpy.mockReturnValue(true);
      document.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(60_000);
      httpMock.expectNone(subscriptionsUrl);

      const refreshedSubscriptionsPromise = firstValueFrom(service.getCurrentSubscriptions().pipe(skip(1)));
      documentHiddenSpy.mockReturnValue(false);
      document.dispatchEvent(new Event('visibilitychange'));

      vi.advanceTimersByTime(0);
      httpMock.expectOne(subscriptionsUrl).flush([]);

      await expect(refreshedSubscriptionsPromise).resolves.toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should refresh current subscriptions once a minute', async () => {
    vi.useFakeTimers();

    try {
      const initialSubscriptionsPromise = firstValueFrom(service.getCurrentSubscriptions());

      vi.advanceTimersByTime(0);
      httpMock.expectOne(`${subscriptionsUrl}/actions/addToken`).flush({message: 'success'});
      httpMock.expectOne(subscriptionsUrl).flush([]);
      await initialSubscriptionsPromise;

      vi.advanceTimersByTime(60_000);
      httpMock.expectOne(subscriptionsUrl).flush([]);
    } finally {
      vi.useRealTimers();
    }
  });
});
