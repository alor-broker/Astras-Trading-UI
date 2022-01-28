/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { WidgetSettingsService } from './widget-settings.service';

describe('WidgetSettingsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WidgetSettingsService]
    });
  });

  it('should ...', inject([WidgetSettingsService], (service: WidgetSettingsService) => {
    expect(service).toBeTruthy();
  }));
});
