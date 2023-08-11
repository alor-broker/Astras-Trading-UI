import { TestBed } from '@angular/core/testing';

import { ApplicationMetaService } from './application-meta.service';
import {LocalStorageService} from "./local-storage.service";

describe('ApplicationMetaService', () => {
  let service: ApplicationMetaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: LocalStorageService,
          useValue: {
            getItem: jasmine.createSpy('getItem').and.returnValue(undefined),
            setItem: jasmine.createSpy('setItem').and.callThrough()
          }
        }
      ]
    });
    service = TestBed.inject(ApplicationMetaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
