/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { PositionsService } from './positions.service';

describe('Service: Positions', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PositionsService]
    });
  });

  it('should ...', inject([PositionsService], (service: PositionsService) => {
    expect(service).toBeTruthy();
  }));
});
