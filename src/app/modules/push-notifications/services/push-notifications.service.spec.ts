import {TestBed} from '@angular/core/testing';

import {PushNotificationsService} from './push-notifications.service';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {AngularFireMessaging} from "@angular/fire/compat/messaging";
import {of, Subject} from "rxjs";
import {ErrorHandlerService} from "../../../shared/services/handle-error/error-handler.service";
import {TimezoneConverterService} from "../../../shared/services/timezone-converter.service";
import {TimezoneConverter} from "../../../shared/utils/timezone-converter";
import {TimezoneDisplayOption} from "../../../shared/models/enums/timezone-display-option";
import {LocalStorageService} from "../../../shared/services/local-storage.service";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { TranslatorService } from "../../../shared/services/translator.service";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('FirebaseNotificationsService', () => {
  let service: PushNotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        {
            provide: AngularFireMessaging,
            useValue: {
                requestToken: of('testToken')
            }
        },
        {
            provide: ErrorHandlerService,
            useValue: {}
        },
        {
            provide: LocalStorageService,
            useValue: {
                getItemStream: jasmine.createSpy('getItemStream').and.returnValue(new Subject()),
                setItem: jasmine.createSpy('setItem').and.callThrough(),
                getItem: jasmine.createSpy('getItem').and.returnValue(undefined),
            }
        },
        {
            provide: TimezoneConverterService,
            useValue: {
                getConverter: jasmine.createSpy('getConverter').and.returnValue(of(new TimezoneConverter(TimezoneDisplayOption.MskTime)))
            }
        },
        {
            provide: EnvironmentService,
            useValue: {
                apiUrl: ''
            }
        },
        {
            provide: TranslatorService,
            useValue: {
                getActiveLang: jasmine.createSpy('getActiveLang').and.returnValue('ru')
            }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});
    service = TestBed.inject(PushNotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
