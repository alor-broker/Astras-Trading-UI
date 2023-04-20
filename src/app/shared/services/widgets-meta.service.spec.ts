import { TestBed } from '@angular/core/testing';

import { WidgetsMetaService } from './widgets-meta.service';
import {HttpClientTestingModule} from "@angular/common/http/testing";

describe('WidgetsMetaService', () => {
  let service: WidgetsMetaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ]
    });
    service = TestBed.inject(WidgetsMetaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
