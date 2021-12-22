/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { WidgetFactoryService } from './widget-factory.service';

describe('Service: WidgetFactory', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WidgetFactoryService]
    });
  });

  it('should ...', inject([WidgetFactoryService], (service: WidgetFactoryService) => {
    expect(service).toBeTruthy();
  }));
});
