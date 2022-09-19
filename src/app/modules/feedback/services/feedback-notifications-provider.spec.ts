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
import { NewFeedback } from '../models/feedback.model';
import { NotificationMeta } from '../../notifications/models/notification.model';

describe('FeedbackNotificationsProvider', () => {
  let provider: FeedbackNotificationsProvider;

  let feedbackServiceSpy: any;
  let modalServiceSpy: any;

  const readNotification = (notifications$: Observable<NotificationMeta[]>, read: (notifications: NotificationMeta[]) => void) => {
    notifications$.pipe(
      take(1)
    ).subscribe(x => read(x));
  };

  beforeEach(() => {
    feedbackServiceSpy = jasmine.createSpyObj(
      'FeedbackService',
      [
        'getLastFeedbackCheck',
        'setLastFeedbackCheck',
        'requestFeedback'
      ]);

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
      feedbackServiceSpy.getLastFeedbackCheck.and.returnValue(null);
      feedbackServiceSpy.requestFeedback.and.returnValue(of(null));

      provider.getNotifications().subscribe();
      jasmine.clock().tick(5000);

      expect(feedbackServiceSpy.requestFeedback).not.toHaveBeenCalled();

      jasmine.clock().tick(3600 * 1000 + 2 * 1000);

      expect(feedbackServiceSpy.requestFeedback).toHaveBeenCalled();
      discardPeriodicTasks();
    })
  );

  it('should request feedback after 1 hours of last check', fakeAsync(() => {
      feedbackServiceSpy.getLastFeedbackCheck.and.returnValue(new Date().getTime());
      feedbackServiceSpy.requestFeedback.and.returnValue(of(null));

      provider.getNotifications().subscribe();
      jasmine.clock().tick(5000);

      expect(feedbackServiceSpy.requestFeedback).not.toHaveBeenCalled();

      jasmine.clock().tick(3600 * 1000 + 2 * 1000);

      expect(feedbackServiceSpy.requestFeedback).toHaveBeenCalled();
      discardPeriodicTasks();
    })
  );

  it('should remove notification after read', fakeAsync(() => {
      const testFeedbackRequest = {
        feedbackCode: 'testCode',
        description: 'description'
      } as NewFeedback;

      feedbackServiceSpy.getLastFeedbackCheck.and.returnValue(new Date().getTime() - (3600 * 1000 + 5 * 1000));
      feedbackServiceSpy.requestFeedback.and.returnValue(of(testFeedbackRequest));

      const notifications$ = provider.getNotifications().pipe(
        shareReplay(1)
      );

      notifications$.subscribe();
      jasmine.clock().tick(5000);

      expect(feedbackServiceSpy.requestFeedback).toHaveBeenCalled();

      readNotification(notifications$, notifications => {
        expect(notifications.length).toBe(1);

        notifications[0].markAsRead!();

        readNotification(notifications$, notifications => {
          expect(notifications.length).toBe(0);
        });
      });

      discardPeriodicTasks();
    })
  );

  it('should return new notification after read', fakeAsync(() => {
      const testFeedbackRequest = {
        feedbackCode: 'testCode',
        description: 'description'
      } as NewFeedback;

      feedbackServiceSpy.getLastFeedbackCheck.and.returnValue(new Date().getTime() - (3600 * 1000 + 5 * 1000));
      feedbackServiceSpy.requestFeedback.and.returnValue(of(testFeedbackRequest));

      const notifications$ = provider.getNotifications().pipe(
        shareReplay(1)
      );

      notifications$.subscribe();
      jasmine.clock().tick(5000);

      expect(feedbackServiceSpy.requestFeedback).toHaveBeenCalled();

      readNotification(notifications$, notifications => {
        expect(notifications.length).toBe(1);

        notifications[0].markAsRead!();

        readNotification(notifications$, notifications => {
          expect(notifications.length).toBe(0);

          jasmine.clock().tick(3600 * 1000 + 5 * 1000);

          readNotification(notifications$, notifications => {
            expect(notifications.length).toBe(1);
          });
        });
      });

      discardPeriodicTasks();
    })
  );

  it('should open feedback dialog', fakeAsync(() => {
      const testFeedbackRequest = {
        feedbackCode: 'testCode',
        description: 'description'
      } as NewFeedback;

      feedbackServiceSpy.getLastFeedbackCheck.and.returnValue(new Date().getTime() - (3600 * 1000 + 5 * 1000));
      feedbackServiceSpy.requestFeedback.and.returnValue(of(testFeedbackRequest));

      const notifications$ = provider.getNotifications().pipe(
        shareReplay(1)
      );

      notifications$.subscribe();
      jasmine.clock().tick(5000);

      expect(feedbackServiceSpy.requestFeedback).toHaveBeenCalled();

      readNotification(notifications$, notifications => {
        expect(notifications.length).toBe(1);

        notifications[0].open!();

        expect(modalServiceSpy.openVoteModal).toHaveBeenCalledOnceWith(testFeedbackRequest);
      });

      discardPeriodicTasks();
    })
  );
});
