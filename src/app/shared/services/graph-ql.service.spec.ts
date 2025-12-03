import { TestBed } from '@angular/core/testing';

import { GraphQlService } from './graph-ql.service';
import { Subject } from "rxjs";
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { Apollo } from "apollo-angular";
import { TranslatorService } from "./translator.service";
import { InstantNotificationsService } from "./instant-notifications.service";

describe('GraphQlService', () => {
  let service: GraphQlService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Apollo,
          useValue: {
          }
        },
        {
          provide: ErrorHandlerService,
          useValue: {}
        },
        {
          provide: TranslatorService,
          useValue: {
            getTranslator: jasmine.createSpy('getTranslator').and.returnValue(new Subject())
          }
        },
        {
          provide: InstantNotificationsService,
          useValue: {
            showNotification: jasmine.createSpy('showNotification').and.callThrough()
          }
        },
      ]
    });
    service = TestBed.inject(GraphQlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
