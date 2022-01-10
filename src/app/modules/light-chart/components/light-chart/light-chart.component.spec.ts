import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LightChartSettings } from 'src/app/shared/models/settings/light-chart-settings.model';
import { LightChartService } from '../../services/light-chart.service';

import { LightChartComponent } from './light-chart.component';

describe('LightChartComponent', () => {
  let component: LightChartComponent;
  let fixture: ComponentFixture<LightChartComponent>;
  const spy = jasmine.createSpyObj('LightChartService', ['settings$', 'resize'])
  const settings: LightChartSettings = {
    timeFrame: 'D',
    from: 0,
    symbol: 'SBER',
    exchange: 'MOEX'
  }
  spy.settings$ = of(settings);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LightChartComponent ],
      providers: [
        { provide: LightChartService, useValue: spy }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LightChartComponent);
    component = fixture.componentInstance;
    component.resize = jasmine.createSpyObj('resize', ['subscribe']);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
