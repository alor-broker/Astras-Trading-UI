/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { LightChartSettingsComponent } from './light-chart-settings.component';
import { LightChartService } from '../../services/light-chart.service';
import { of } from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';
import { LightChartSettings } from 'src/app/shared/models/settings/light-chart-settings.model';
import { AppModule } from 'src/app/app.module';

describe('LightChartSettingsComponent', () => {
  let component: LightChartSettingsComponent;
  let fixture: ComponentFixture<LightChartSettingsComponent>;
  const spy = jasmine.createSpyObj('LightChartService', ['getBars', 'getSettings']);
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
  spy.getSettings.and.returnValue(of(settings));

  beforeEach((async () => {
    await TestBed.configureTestingModule({
      declarations: [ LightChartSettingsComponent ],
      imports: [ SharedModule, AppModule ],
      providers: [
        { provide: LightChartService, useValue:  spy }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LightChartSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
