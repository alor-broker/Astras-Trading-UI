/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { WidgetFactoryService } from './widget-factory.service';

describe('WidgetFactoryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WidgetFactoryService,
        provideMockStore(),
      ]
    });
  });

  it('should ...', inject([WidgetFactoryService], (service: WidgetFactoryService) => {
    expect(service).toBeTruthy();
  }));
});
