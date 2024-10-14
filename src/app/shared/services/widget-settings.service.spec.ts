import { TestBed } from '@angular/core/testing';
import { WidgetSettingsService } from './widget-settings.service';
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { WidgetSettingsFeature } from "../../store/widget-settings/widget-settings.reducer";
import { commonTestProviders } from "../utils/testing/common-test-providers";

describe('WidgetSettingsService', () => {
  let service: WidgetSettingsService;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        StoreModule.forFeature(WidgetSettingsFeature),
      ],
      providers: [
        WidgetSettingsService,
        ...commonTestProviders
      ],
    });

    service = TestBed.inject(WidgetSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
