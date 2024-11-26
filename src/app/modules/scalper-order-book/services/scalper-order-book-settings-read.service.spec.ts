import { TestBed } from '@angular/core/testing';

import { ScalperOrderBookSettingsReadService } from "./scalper-order-book-settings-read.service";
import { MockProviders } from "ng-mocks";
import { WidgetSettingsService } from "../../../shared/services/widget-settings.service";
import { ScalperSharedSettingsService } from "./scalper-shared-settings.service";
import { InstrumentsService } from "../../instruments/services/instruments.service";

describe('ScalperOrderBookSettingsReadService', () => {
  let service: ScalperOrderBookSettingsReadService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers:[
        MockProviders(
          WidgetSettingsService,
          ScalperSharedSettingsService,
          InstrumentsService
        )
      ]
    });
    service = TestBed.inject(ScalperOrderBookSettingsReadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
