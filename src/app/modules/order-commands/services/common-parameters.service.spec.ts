import { TestBed } from '@angular/core/testing';

import { CommonParametersService } from './common-parameters.service';

describe('CommonParametersService', () => {
  let service: CommonParametersService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers:[
        CommonParametersService
      ]
    });
    service = TestBed.inject(CommonParametersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
