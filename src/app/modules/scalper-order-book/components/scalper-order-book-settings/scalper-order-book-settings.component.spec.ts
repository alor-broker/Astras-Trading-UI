import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ScalperOrderBookSettingsComponent} from './scalper-order-book-settings.component';
import {of} from "rxjs";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {InputNumberComponent} from "../../../../shared/components/input-number/input-number.component";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {WidgetSettingsComponent} from "../../../../shared/components/widget-settings/widget-settings.component";
import {MockComponents, MockDirectives, MockProvider} from "ng-mocks";
import {ScalperOrderBookSettingsReadService} from "../../services/scalper-order-book-settings-read.service";
import {ScalperOrderBookSettingsWriteService} from "../../services/scalper-order-book-settings-write.service";
import {InstrumentSearchComponent} from "../../../../shared/components/instrument-search/instrument-search.component";
import {
  InstrumentBoardSelectComponent
} from "../../../../shared/components/instrument-board-select/instrument-board-select.component";
import {NzSliderComponent} from "ng-zorro-antd/slider";
import {NzSwitchComponent} from "ng-zorro-antd/switch";
import {NzOptionComponent, NzSelectComponent} from "ng-zorro-antd/select";
import {NzRadioComponent, NzRadioGroupComponent} from "ng-zorro-antd/radio";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {NzColorPickerComponent} from "ng-zorro-antd/color-picker";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {GuidGenerator} from "../../../../shared/utils/guid";

xdescribe('ScalperOrderBookSettingsComponent', () => {
  let component: ScalperOrderBookSettingsComponent;
  let fixture: ComponentFixture<ScalperOrderBookSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ScalperOrderBookSettingsComponent,
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        MockComponents(
          WidgetSettingsComponent,
          InstrumentSearchComponent,
          InstrumentBoardSelectComponent,
          NzSliderComponent,
          NzSwitchComponent,
          NzSelectComponent,
          NzOptionComponent,
          NzRadioGroupComponent,
          NzRadioComponent,
          InputNumberComponent,
          NzButtonComponent,
          NzTypographyComponent,
          NzColorPickerComponent,
        ),
        MockDirectives(
          NzIconDirective,
          NzTooltipDirective
        )
      ],
      providers: [
        MockProvider(ScalperOrderBookSettingsReadService, {
          readSettings: jasmine.createSpy('getSettings').and.returnValue(of({
            symbol: 'SBER',
            exchange: 'MOEX'
          }))
        }),
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
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
