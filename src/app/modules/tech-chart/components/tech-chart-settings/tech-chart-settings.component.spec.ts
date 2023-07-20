import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { TechChartSettingsComponent } from './tech-chart-settings.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {of, Subject} from "rxjs";
import { TechChartModule } from "../../tech-chart.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {
  commonTestProviders,
  getTranslocoModule,
  mockComponent,
  sharedModuleImportForTests
} from '../../../../shared/utils/testing';
import { TechChartSettings } from '../../models/tech-chart-settings.model';
import {InstrumentsService} from "../../../instruments/services/instruments.service";

describe('TechChartSettingsComponent', () => {
  let component: TechChartSettingsComponent;
  let fixture: ComponentFixture<TechChartSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        TechChartSettingsComponent
      ],
      imports: [
        TechChartModule,
        BrowserAnimationsModule,
        ...sharedModuleImportForTests,
        getTranslocoModule()
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
