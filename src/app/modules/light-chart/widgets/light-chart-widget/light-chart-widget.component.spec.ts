import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
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
    symbol: 'SBER',
    exchange: 'MOEX',
    guid: '123',
    width: 300,
    height: 300
  };
  spyChart.settings$ = of(settings);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LightChartWidgetComponent],
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
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LightChartWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
