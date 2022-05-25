/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LightChartSettingsComponent } from './light-chart-settings.component';
import { LightChartService } from '../../services/light-chart.service';
import { of } from 'rxjs';
import { LightChartSettings } from 'src/app/shared/models/settings/light-chart-settings.model';
import { AppModule } from 'src/app/app.module';
import { sharedModuleImportForTests } from '../../../../shared/utils/testing';

describe('LightChartSettingsComponent', () => {
  let component: LightChartSettingsComponent;
  let fixture: ComponentFixture<LightChartSettingsComponent>;
  const spy = jasmine.createSpyObj('LightChartService', ['getBars', 'getSettings']);
  spy.getBars.and.returnValue(of([]));
  const settings: LightChartSettings = {
    timeFrame: 'D',
    symbol: 'SBER',
    exchange: 'MOEX',
    guid: '123',
    width: 300,
    height: 300
  };
  spy.getSettings.and.returnValue(of(settings));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach((async () => {
    await TestBed.configureTestingModule({
      declarations: [LightChartSettingsComponent],
      imports: [...sharedModuleImportForTests, AppModule],
      providers: [
        { provide: LightChartService, useValue: spy }
      ]
    })
      .compileComponents();
  }));

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
