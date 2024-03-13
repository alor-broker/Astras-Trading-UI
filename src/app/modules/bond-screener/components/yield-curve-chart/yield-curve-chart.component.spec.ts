import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YieldCurveChartComponent } from './yield-curve-chart.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { Subject } from "rxjs";
import { BondScreenerService } from "../../services/bond-screener.service";
import {
  getTranslocoModule,
  mockComponent,
  ngZorroMockComponents
} from "../../../../shared/utils/testing";
import {
  ACTIONS_CONTEXT,
  ActionsContext
} from "../../../../shared/services/actions-context";
import { LetDirective } from "@ngrx/component";
import { GuidGenerator } from "../../../../shared/utils/guid";

describe('YieldCurveChartComponent', () => {
  let component: YieldCurveChartComponent;
  let fixture: ComponentFixture<YieldCurveChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        LetDirective
      ],
      declarations: [
        YieldCurveChartComponent,
        mockComponent({
          selector: 'ats-yield-curve-chart-parameters'
        }),
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: BondScreenerService,
          useValue: {
            getBondsYieldCurve: jasmine.createSpy('getBondsYieldCurve').and.returnValue(new Subject())
          }
        },
        {
          provide: ACTIONS_CONTEXT,
          useValue: {
            instrumentSelected: jasmine.createSpy('instrumentSelected').and.callThrough()
          }
        }
      ]
    });
    fixture = TestBed.createComponent(YieldCurveChartComponent);
    component = fixture.componentInstance;
    component.guid = GuidGenerator.newGuid();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
