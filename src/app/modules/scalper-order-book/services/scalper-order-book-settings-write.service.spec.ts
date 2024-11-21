import { TestBed } from '@angular/core/testing';
import { ScalperOrderBookSettingsWriteService } from "./scalper-order-book-settings-write.service";
import { MockProviders } from "ng-mocks";
import { WidgetSettingsService } from "../../../shared/services/widget-settings.service";
import { ScalperSharedSettingsService } from "./scalper-shared-settings.service";

describe('ScalperOrderBookSettingsWriteService', () => {
  let service: ScalperOrderBookSettingsWriteService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers:[
        MockProviders(
          WidgetSettingsService,
          ScalperSharedSettingsService
        )
      ]
    });
    service = TestBed.inject(ScalperOrderBookSettingsWriteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
