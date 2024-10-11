import { TestBed } from '@angular/core/testing';
import { ApplicationReleaseNotificationProvider } from './application-release-notification-provider';
import { ApplicationMetaService } from './application-meta.service';
import { ModalService } from '../../../shared/services/modal.service';
import { BehaviorSubject, take } from 'rxjs';
import { ReleaseMeta } from '../models/application-release.model';
import ruApplicationMetaService from '../../../../assets/i18n/application-meta/application-meta-service/ru.json';
import { TranslocoTestsModule } from "../../../shared/utils/testing/translocoTestsModule";

describe('ApplicationReleaseNotificationProvider', () => {
  let service: ApplicationReleaseNotificationProvider;

  let applicationMetaServiceSpy: any;
  let modalService: any;

  beforeEach(() => {
    applicationMetaServiceSpy = jasmine.createSpyObj('ApplicationMetaService', ['getCurrentVersion', 'savedVersion$']);

    modalService = jasmine.createSpyObj('ModalService', ['openApplicationUpdatedModal']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule({
          langs: {
            'application-meta/application-meta-service': ruApplicationMetaService
          }
        })
      ],
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
    const versionMock = new BehaviorSubject<ReleaseMeta | null>(null);
    applicationMetaServiceSpy.getCurrentVersion.and.returnValue(versionMock);

    const cases: { currentVersion: string | null, savedVersion: string | null, isNotificationExpected: boolean } [] = [
      {
        currentVersion: null,
        savedVersion: 'CHANGES-2079',
        isNotificationExpected: false
      },
      {
        currentVersion: 'CHANGES-2079',
        savedVersion: null,
        isNotificationExpected: true
      },
      {
        currentVersion: 'CHANGES-2079',
        savedVersion: 'CHANGES-2080',
        isNotificationExpected: true
      },
      {
        currentVersion: 'CHANGES-2079',
        savedVersion: 'CHANGES-2079',
        isNotificationExpected: false
      }
    ];

    cases.forEach(testCase => {
      versionMock.next((testCase.currentVersion ?? '')
? {
          id: testCase.currentVersion!,
          summary: 'summary',
          description: 'description',
          createdAt: new Date().getTime()
        }
        : null);

      applicationMetaServiceSpy.savedVersion$ = new BehaviorSubject<string | null>(testCase.savedVersion);

      service.getNotifications().pipe(
        take(1)
      ).subscribe(notifications => {
        if (testCase.isNotificationExpected) {
          expect(notifications.length).toBe(1);
        }
        else {
          expect(notifications.length).toBe(0);
        }
      });
    });
  });
});
