import { TestBed } from '@angular/core/testing';

import { LocaleService } from './locale.service';
import { MockProvider } from "ng-mocks";
import { LocalStorageService } from "./local-storage.service";

describe('LocaleService', () => {
  let service: LocaleService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers:[
        MockProvider(LocalStorageService)
      ]
    });
    service = TestBed.inject(LocaleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
