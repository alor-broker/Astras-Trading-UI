import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WidgetNames } from 'src/app/shared/models/enums/widget-names';
import { LightChartSettings } from 'src/app/shared/models/settings/light-chart-settings.model';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { LightChartService } from '../../services/light-chart.service';

import { LightChartWidgetComponent } from './light-chart-widget.component';

describe('LightChartWidgetComponent', () => {
  let component: LightChartWidgetComponent;
  let fixture: ComponentFixture<LightChartWidgetComponent>;
  const spyChart = jasmine.createSpyObj('LightChartService', ['setSettings']);
  const spyDashboard = jasmine.createSpyObj('DashboardService', ['updateWidget']);
  const settings: LightChartSettings = {
    timeFrame: 'D',
    from: 0,
    symbol: 'SBER',
    exchange: 'MOEX'
  }
  spyChart.settings$ = of(settings);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LightChartWidgetComponent ],
      providers: [
        { provide: DashboardService, useValue: spyDashboard },
      ]
    })
    .compileComponents();

    TestBed.overrideComponent(LightChartWidgetComponent, {
      set: {
        providers: [
          { provide: LightChartService, useValue: spyChart },
        ]
      }
    })
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LightChartWidgetComponent);
    component = fixture.componentInstance;
    component.widget = {
      title: WidgetNames.lightChart,
      gridItem: { x: 0, y: 0, rows: 1, cols: 1 },
      settings: {
        exchange: 'MOEX',
        symbol: 'SBER',
        timeFrame: 'D',
        from: 0
      }
    }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
