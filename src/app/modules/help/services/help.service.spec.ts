/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { HelpService } from './help.service';

describe('Service: Help', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HelpService]
    });
  });

  it('should ...', inject([HelpService], (service: HelpService) => {
    expect(service).toBeTruthy();
  }));
});
