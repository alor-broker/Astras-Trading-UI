import {
  discardPeriodicTasks,
  fakeAsync,
  TestBed
} from '@angular/core/testing';

import { FeedbackService } from './feedback.service';
import { FeedbackNotificationsProvider } from './feedback-notifications-provider';
import { ModalService } from '../../../shared/services/modal.service';
import {
  Observable,
  of,
  shareReplay,
  take
} from 'rxjs';
import {
  FeedbackMeta,
  NewFeedback,
  UnansweredFeedback
} from '../models/feedback.model';
import { NotificationMeta } from '../../notifications/models/notification.model';

describe('FeedbackNotificationsProvider', () => {
  let provider: FeedbackNotificationsProvider;

  let feedbackServiceSpy: any;
  let modalServiceSpy: any;

  const oneHourPlusDelay = 3600 * 1000 + 2 * 1000;

  const readNotification = (notifications$: Observable<NotificationMeta[]>, read: (notifications: NotificationMeta[]) => void) => {
    notifications$.pipe(
      take(1)
    ).subscribe(x => read(x));
  };

  beforeEach(() => {
    feedbackServiceSpy = jasmine.createSpyObj(
      'FeedbackService',
      [
        'getSavedFeedbackMeta',
        'setLastFeedbackCheck',
        'setLastFeedbackCheck',
        'setUnansweredFeedback',
        'requestFeedback'
      ]);

    feedbackServiceSpy.unansweredFeedbackRemoved$ = of({});

    modalServiceSpy = jasmine.createSpyObj('ModalService', ['openVoteModal']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FeedbackNotificationsProvider,
        {
          provide: FeedbackService,
          useValue: feedbackServiceSpy
        },
        {
          provide: ModalService,
          useValue: modalServiceSpy
        }
      ]
    });

    provider = TestBed.inject(FeedbackNotificationsProvider);
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  it('should be created', () => {
    expect(provider).toBeTruthy();
  });

  it('should request feedback after 1 hours at first start', fakeAsync(() => {
      feedbackServiceSpy.getSavedFeedbackMeta.and.returnValue(null);
      feedbackServiceSpy.requestFeedback.and.returnValue(of(null));

      provider.getNotifications().subscribe();
      jasmine.clock().tick(5000);

      expect(feedbackServiceSpy.requestFeedback).not.toHaveBeenCalled();

      jasmine.clock().tick(oneHourPlusDelay);

      expect(feedbackServiceSpy.requestFeedback).toHaveBeenCalled();
      discardPeriodicTasks();
    })
  );

  it('should request feedback after 1 hours of last check', fakeAsync(() => {
      feedbackServiceSpy.getSavedFeedbackMeta.and.returnValue({ lastCheck: new Date().getTime() } as FeedbackMeta);
      feedbackServiceSpy.requestFeedback.and.returnValue(of(null));

      provider.getNotifications().subscribe();
      jasmine.clock().tick(5000);

      expect(feedbackServiceSpy.requestFeedback).not.toHaveBeenCalled();

      jasmine.clock().tick(oneHourPlusDelay);

      expect(feedbackServiceSpy.requestFeedback).toHaveBeenCalled();
      discardPeriodicTasks();
    })
  );

  it('should return last unanswered feedback', fakeAsync(() => {
      const savedFeedback: UnansweredFeedback = {
        code: 'testCode',
        description: 'description test',
        isRead: true
      };

      feedbackServiceSpy.getSavedFeedbackMeta.and.returnValue(
        {
          lastCheck: new Date().getTime(),
          lastUnansweredFeedback: savedFeedback
        }
      );

      const notifications$ = provider.getNotifications().pipe(
        shareReplay(1)
      );

      notifications$.subscribe();
      jasmine.clock().tick(1000);

      expect(feedbackServiceSpy.requestFeedback).not.toHaveBeenCalled();

      readNotification(notifications$, notifications => {
        expect(notifications.length).toBe(1);

        const notification = notifications[0];

        expect(notification.isRead).toBe(savedFeedback.isRead);
      });

      discardPeriodicTasks();
    })
  );

  it('should open feedback dialog', fakeAsync(() => {
      const testFeedbackRequest = {
        code: 'testCode',
        description: 'description'
      } as NewFeedback;

      feedbackServiceSpy.getSavedFeedbackMeta.and.returnValue({ lastCheck: new Date().getTime() } as FeedbackMeta);
      feedbackServiceSpy.requestFeedback.and.returnValue(of(testFeedbackRequest));

      const notifications$ = provider.getNotifications().pipe(
        shareReplay(1)
      );

      notifications$.subscribe();
      jasmine.clock().tick(oneHourPlusDelay);

      expect(feedbackServiceSpy.requestFeedback).toHaveBeenCalled();

      readNotification(notifications$, notifications => {
        expect(notifications.length).toBe(1);

        notifications[0].open!();

        expect(modalServiceSpy.openVoteModal).toHaveBeenCalledOnceWith(testFeedbackRequest);
      });

      discardPeriodicTasks();
    })
  );

  it('should update isRead on saved feedback', fakeAsync(() => {
      const savedFeedback: UnansweredFeedback = {
        code: 'testCode',
        description: 'description test',
        isRead: false
      };

      feedbackServiceSpy.getSavedFeedbackMeta.and.returnValue(
        {
          lastCheck: new Date().getTime(),
          lastUnansweredFeedback: savedFeedback
        }
      );

      const notifications$ = provider.getNotifications().pipe(
        shareReplay(1)
      );

      notifications$.subscribe();
      jasmine.clock().tick(1000);

      expect(feedbackServiceSpy.requestFeedback).not.toHaveBeenCalled();

      readNotification(notifications$, notifications => {
        expect(notifications.length).toBe(1);

        const notification = notifications[0];
        notification.markAsRead!();

        expect(feedbackServiceSpy.setUnansweredFeedback).toHaveBeenCalledOnceWith({
          ...savedFeedback,
          isRead: true
        } as UnansweredFeedback);
      });

      discardPeriodicTasks();
    })
  );
});
