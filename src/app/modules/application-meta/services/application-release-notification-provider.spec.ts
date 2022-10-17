import { TestBed } from '@angular/core/testing';
import { ApplicationReleaseNotificationProvider } from './application-release-notification-provider';
import { ApplicationMetaService } from './application-meta.service';
import { ModalService } from '../../../shared/services/modal.service';
import {
  BehaviorSubject,
  take
} from 'rxjs';

describe('ApplicationReleaseNotificationProvider', () => {
  let service: ApplicationReleaseNotificationProvider;

  let applicationMetaServiceSpy: any;
  let modalService: any;

  beforeEach(() => {
    applicationMetaServiceSpy = jasmine.createSpyObj('ApplicationMetaService', ['currentVersion', 'savedVersion$']);

    modalService = jasmine.createSpyObj('ModalService', ['openApplicationUpdatedModal']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApplicationReleaseNotificationProvider,
        {
          provide: ApplicationMetaService,
          useValue: applicationMetaServiceSpy
        },
        {
          provide: ModalService,
          useValue: modalService
        }
      ]
    });

    service = TestBed.inject(ApplicationReleaseNotificationProvider);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should provide notification correctly', () => {
    const cases: { currentVersion: string, savedVersion: string | null, isNotificationExpected: boolean } [] = [
      {
        currentVersion: '1.0.1',
        savedVersion: null,
        isNotificationExpected: true
      },
      {
        currentVersion: '1.0.2',
        savedVersion: '1.0.1',
        isNotificationExpected: true
      },
      {
        currentVersion: '1.1.0',
        savedVersion: '1.0.1',
        isNotificationExpected: true
      },
      {
        currentVersion: '1.10.2',
        savedVersion: '1.0.1',
        isNotificationExpected: true
      },
      {
        currentVersion: '2.1.0',
        savedVersion: '1.0.1',
        isNotificationExpected: true
      },
      {
        currentVersion: '1.0.1',
        savedVersion: '1.0.1',
        isNotificationExpected: false
      },
    ];

    cases.forEach(testCase => {
      applicationMetaServiceSpy.currentVersion = testCase.currentVersion;
      applicationMetaServiceSpy.savedVersion$ = new BehaviorSubject<string | null>(testCase.savedVersion);

      service.getNotifications().pipe(
        take(1)
      ).subscribe(notifications => {
        if(testCase.isNotificationExpected) {
          expect(notifications.length).toBe(1);
        } else {
          expect(notifications.length).toBe(0);
        }
      });
    });
  });
});
