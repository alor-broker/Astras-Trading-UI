/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { AnySettings } from '../models/settings/any-settings.model';
import { BaseService } from './base.service';

describe('Service: Base', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BaseService]
    });
  });

  it('should ...', inject([BaseService], (service: BaseService<AnySettings>) => {
    expect(service).toBeTruthy();
  }));
});
