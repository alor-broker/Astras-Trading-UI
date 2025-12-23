import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TechChartWidgetComponent} from './tech-chart-widget.component';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {EMPTY, of} from 'rxjs';
import {DashboardContextService} from '../../../../shared/services/dashboard-context.service';
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {ThemeService} from "../../../../shared/services/theme.service";
import {MockComponents} from "ng-mocks";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";
import {
  WidgetHeaderInstrumentSwitchComponent
} from "../../../../shared/components/widget-header-instrument-switch/widget-header-instrument-switch.component";
import {TechChartComponent} from "../../components/tech-chart/tech-chart.component";
import {TechChartSettingsComponent} from "../../components/tech-chart-settings/tech-chart-settings.component";
import {InstrumentSearchModalComponent} from "../instrument-search-modal/instrument-search-modal.component";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";

xdescribe('TechChartWidgetComponent', () => {
  let component: TechChartWidgetComponent;
  let fixture: ComponentFixture<TechChartWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        TechChartWidgetComponent,
        MockComponents(
          WidgetSkeletonComponent,
          WidgetHeaderComponent,
          WidgetHeaderInstrumentSwitchComponent,
          TechChartComponent,
          TechChartSettingsComponent,
          InstrumentSearchModalComponent,
        )
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettingsOrNull: jasmine.createSpy('getSettingsOrNull').and.returnValue(of(null)),
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
            addSettings: jasmine.createSpy('addSettings').and.callThrough()
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            terminalSettingsService: of({})
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            instrumentsSelection$: of({})
          }
        },
        {
          provide: ThemeService,
          useValue: {
            getThemeSettings: jasmine.createSpy('getThemeSettings').and.returnValue(EMPTY)
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TechChartWidgetComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      'widgetInstance',
      {
        instance: {
          guid: 'guid'
        } as Widget,
        widgetMeta: {widgetName: {}} as WidgetMeta
      }
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
