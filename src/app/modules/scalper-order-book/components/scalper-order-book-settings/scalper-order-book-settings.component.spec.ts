import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ScalperOrderBookSettingsComponent } from './scalper-order-book-settings.component';
import { of } from "rxjs";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { InstrumentBoardSelectMockComponent } from "../../../../shared/utils/testing/instrument-board-select-mock-component";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { InputNumberComponent } from "../../../../shared/components/input-number/input-number.component";
import { FormsTesting } from "../../../../shared/utils/testing/forms-testing";
import { WidgetSettingsComponent } from "../../../../shared/components/widget-settings/widget-settings.component";
import { InstrumentSearchMockComponent } from "../../../../shared/utils/testing/instrument-search-mock-component";
import { MockProvider } from "ng-mocks";
import { ScalperOrderBookSettingsReadService } from "../../services/scalper-order-book-settings-read.service";
import { ScalperOrderBookSettingsWriteService } from "../../services/scalper-order-book-settings-write.service";

describe('ScalperOrderBookSettingsComponent', () => {
  let component: ScalperOrderBookSettingsComponent;
  let fixture: ComponentFixture<ScalperOrderBookSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ScalperOrderBookSettingsComponent,
      ],
      imports: [
        TranslocoTestsModule.getModule(),
        WidgetSettingsComponent,
        ...FormsTesting.getTestingModules(),
        InstrumentBoardSelectMockComponent,
        InstrumentSearchMockComponent,
        InputNumberComponent
      ],
      providers: [
        MockProvider(
          ScalperOrderBookSettingsReadService,
          {
            readSettings: jasmine.createSpy('getSettings').and.returnValue(of({
              symbol: 'SBER',
              exchange: 'MOEX'
            }))
          },
        ),
        MockProvider(ScalperOrderBookSettingsWriteService),
        {
          provide: ManageDashboardsService,
          useValue: {
            copyWidget: jasmine.createSpy('copyWidget').and.callThrough(),
          }
        },
        ...commonTestProviders
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScalperOrderBookSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
