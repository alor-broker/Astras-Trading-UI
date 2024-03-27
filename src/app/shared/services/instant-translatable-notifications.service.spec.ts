import { TestBed } from '@angular/core/testing';

import { InstantTranslatableNotificationsService } from './instant-translatable-notifications.service';
import { InstantNotificationsService } from "./instant-notifications.service";
import { TranslatorService } from "./translator.service";
import { of } from "rxjs";

describe('InstantTranslatableNotificationsService', () => {
  let service: InstantTranslatableNotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: InstantNotificationsService,
          useValue: {
            showNotification: jasmine.createSpy('showNotification').and.callThrough()
          }
        },
        {
          provide: TranslatorService,
          useValue: {
            getTranslatorFn: jasmine.createSpy('getTranslatorFn').and.returnValue(of(() => ''))
          }
        }
      ]
    });
    service = TestBed.inject(InstantTranslatableNotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
