/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { AnySettings } from '../models/settings/any-settings.model';
import { BaseService } from './base.service';

describe('BaseService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BaseService,
        provideMockStore()
      ]
    });
  });

  it('should ...', inject([BaseService], (service: BaseService<AnySettings>) => {
    expect(service).toBeTruthy();
  }));
});
