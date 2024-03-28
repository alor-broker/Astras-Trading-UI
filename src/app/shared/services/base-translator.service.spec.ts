import { TestBed } from '@angular/core/testing';

import { BaseTranslatorService } from './base-translator.service';
import { InstantNotificationsService } from "./instant-notifications.service";
import { TranslatorService } from "./translator.service";
import { of } from "rxjs";

describe('InstantTranslatableNotificationsService', () => {
  let service: BaseTranslatorService;

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
    service = TestBed.inject(BaseTranslatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
