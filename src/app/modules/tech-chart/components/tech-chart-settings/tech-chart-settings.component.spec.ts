import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { TechChartSettingsComponent } from './tech-chart-settings.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { TechChartSettings } from "../../../../shared/models/settings/tech-chart-settings.model";
import { TechChartModule } from "../../tech-chart.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { sharedModuleImportForTests } from '../../../../shared/utils/testing';

describe('TechChartSettingsComponent', () => {
  let component: TechChartSettingsComponent;
  let fixture: ComponentFixture<TechChartSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TechChartSettingsComponent],
      imports: [
        TechChartModule,
        BrowserAnimationsModule,
        ...sharedModuleImportForTests
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({} as TechChartSettings)),
            updateSettings: jasmine.createSpy('getSettings').and.callThrough(),
          }
        }
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
