import { TestBed } from '@angular/core/testing';

import { GraphQlErrorHandlerService } from './graph-ql-error-handler.service';
import { NzNotificationService } from "ng-zorro-antd/notification";
import { TranslatorService } from "../translator.service";
import { Subject } from "rxjs";

describe('GraphQlErrorHandlerService', () => {
  let service: GraphQlErrorHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NzNotificationService,
          useValue: {
            error: jasmine.createSpy('error').and.callThrough()
          }
        },
        {
          provide: TranslatorService,
          useValue: {
            getTranslator: jasmine.createSpy('getTranslator').and.returnValue(new Subject())
          }
        },
        GraphQlErrorHandlerService,
      ]
    });
    service = TestBed.inject(GraphQlErrorHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
