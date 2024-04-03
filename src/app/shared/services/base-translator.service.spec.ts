import { TestBed } from '@angular/core/testing';

import { BaseTranslatorService } from './base-translator.service';
import { InstantNotificationsService } from "./instant-notifications.service";
import { TranslatorService } from "./translator.service";
import { of } from "rxjs";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
class WrapperService extends BaseTranslatorService {
  protected translationsPath = '';
  constructor(
    protected readonly translatorService: TranslatorService,
  ) {
    super(translatorService);
  }
}

describe('BaseTranslatorService', () => {
  let service: WrapperService;

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
    service = TestBed.inject(WrapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
