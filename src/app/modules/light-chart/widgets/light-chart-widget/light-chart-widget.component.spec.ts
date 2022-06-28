import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LightChartService } from '../../services/light-chart.service';

import { LightChartWidgetComponent } from './light-chart-widget.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { LightChartSettings } from "../../../../shared/models/settings/light-chart-settings.model";

describe('LightChartWidgetComponent', () => {
  let component: LightChartWidgetComponent;
  let fixture: ComponentFixture<LightChartWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LightChartWidgetComponent],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            updateIsLinked: jasmine.createSpy('updateIsLinked').and.callThrough()
          }
        },
      ]
    })
      .compileComponents();

    TestBed.overrideComponent(LightChartWidgetComponent, {
      set: {
        providers: []
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
