import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subscription } from 'rxjs';
import { LightChartSettings } from 'src/app/shared/models/settings/light-chart-settings.model';
import { LightChartService } from '../../services/light-chart.service';

import { LightChartComponent } from './light-chart.component';

describe('LightChartComponent', () => {
  let component: LightChartComponent;
  let fixture: ComponentFixture<LightChartComponent>;
  const spy = jasmine.createSpyObj('LightChartService', ['settings$', 'resize', 'unsubscribe', 'getBars']);
  spy.getBars.and.returnValue(of([]));
  const settings: LightChartSettings = {
    timeFrame: 'D',
    from: 0,
    symbol: 'SBER',
    exchange: 'MOEX',
    guid: '123',
    width: 300,
    height: 300
  };
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
    const spy = jasmine.createSpyObj('resize', ['subscribe']);
    spy.subscribe.and.returnValue(new Subscription());
    component.resize = spy;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
