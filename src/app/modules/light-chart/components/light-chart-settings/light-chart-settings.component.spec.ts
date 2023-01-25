import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LightChartSettingsComponent } from './light-chart-settings.component';
import { of } from 'rxjs';
import { AppModule } from 'src/app/app.module';
import {
  getTranslocoModule,
  mockComponent,
  sharedModuleImportForTests
} from '../../../../shared/utils/testing';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { LightChartSettings } from '../../models/light-chart-settings.model';

describe('LightChartSettingsComponent', () => {
  let component: LightChartSettingsComponent;
  let fixture: ComponentFixture<LightChartSettingsComponent>;
  const spy = jasmine.createSpyObj('LightChartService', ['getBars']);
  spy.getBars.and.returnValue(of([]));

  const settings: LightChartSettings = {
    timeFrame: 'D',
    symbol: 'SBER',
    exchange: 'MOEX',
    guid: '123',
    width: 300,
    height: 300
  };

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach((async () => {
    await TestBed.configureTestingModule({
      declarations: [
        LightChartSettingsComponent,
        mockComponent({ selector: 'ats-instrument-board-select', inputs: ['symbol', 'placeholder'] })
      ],
      imports: [
        ...sharedModuleImportForTests,
        AppModule,
        getTranslocoModule()
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settings)),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
          }
        }
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
