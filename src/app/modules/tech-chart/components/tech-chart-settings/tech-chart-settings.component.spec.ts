import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { TechChartSettingsComponent } from './tech-chart-settings.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  EMPTY,
  of,
  Subject
} from "rxjs";
import { TechChartSettings } from '../../models/tech-chart-settings.model';
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { ThemeService } from "../../../../shared/services/theme.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { InstrumentBoardSelectMockComponent } from "../../../../shared/utils/testing/instrument-board-select-mock-component";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { FormsTesting } from "../../../../shared/utils/testing/forms-testing";
import { WidgetSettingsComponent } from "../../../../shared/components/widget-settings/widget-settings.component";
import { InstrumentSearchComponent } from "../../../../shared/components/instrument-search/instrument-search.component";

describe('TechChartSettingsComponent', () => {
  let component: TechChartSettingsComponent;
  let fixture: ComponentFixture<TechChartSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        TechChartSettingsComponent,
      ],
      imports: [
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getTestingModules(),
        WidgetSettingsComponent,
        InstrumentBoardSelectMockComponent,
        InstrumentSearchComponent
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({} as TechChartSettings)),
            updateSettings: jasmine.createSpy('getSettings').and.callThrough(),
          }
        },
        {
          provide: InstrumentsService,
          useValue: {
            getInstrumentBoards: jasmine.createSpy('getInstrumentBoards').and.returnValue(new Subject())
          }
        },
        {
          provide: ManageDashboardsService,
          useValue: {
            copyWidget: jasmine.createSpy('copyWidget').and.callThrough(),
          }
        },
        {
          provide: ThemeService,
          useValue: {
            getThemeSettings: jasmine.createSpy('getThemeSettings').and.returnValue(EMPTY),
          }
        },
        ...commonTestProviders
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TechChartSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
