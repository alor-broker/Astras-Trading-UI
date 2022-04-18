import { TestBed, inject } from '@angular/core/testing';
import { WidgetSettingsService } from './widget-settings.service';
import { provideMockStore, MockStore } from '@ngrx/store/testing';

describe('WidgetSettingsService', () => {
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WidgetSettingsService,
        provideMockStore(),
      ],
    });
    store = TestBed.inject(MockStore);
  });

  it('should ...', inject([WidgetSettingsService], (service: WidgetSettingsService) => {
    expect(service).toBeTruthy();
  }));
});

