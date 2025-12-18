import {ComponentFixture, TestBed} from '@angular/core/testing';

import {LightChartSettingsComponent} from './light-chart-settings.component';
import {of} from 'rxjs';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {LightChartSettings} from '../../models/light-chart-settings.model';
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {TimeframeValue} from "../../models/light-chart.models";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {MockComponents, MockDirectives} from "ng-mocks";
import {WidgetSettingsComponent} from "../../../../shared/components/widget-settings/widget-settings.component";
import {InstrumentSearchComponent} from "../../../../shared/components/instrument-search/instrument-search.component";
import {RemoveSelectTitlesDirective} from "../../../../shared/directives/remove-select-titles.directive";
import {
  InstrumentBoardSelectComponent
} from "../../../../shared/components/instrument-board-select/instrument-board-select.component";

describe('LightChartSettingsComponent', () => {
  let component: LightChartSettingsComponent;
  let fixture: ComponentFixture<LightChartSettingsComponent>;
  const spy = jasmine.createSpyObj('LightChartService', ['getBars']);
  spy.getBars.and.returnValue(of([]));

  const settings: LightChartSettings = {
    timeFrame: TimeframeValue.Day,
    symbol: 'SBER',
    exchange: 'MOEX',
    guid: '123',
    width: 300,
    height: 300
  };

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LightChartSettingsComponent,
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        MockComponents(
          WidgetSettingsComponent,
          InstrumentSearchComponent,
          InstrumentBoardSelectComponent,
        ),
        MockDirectives(
          RemoveSelectTitlesDirective
        )
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settings)),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
          }
        },
        {
          provide: ManageDashboardsService,
          useValue: {
            copyWidget: jasmine.createSpy('copyWidget').and.callThrough(),
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LightChartSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
