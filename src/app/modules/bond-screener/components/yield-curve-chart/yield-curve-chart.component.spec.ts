import {ComponentFixture, TestBed} from '@angular/core/testing';

import {YieldCurveChartComponent} from './yield-curve-chart.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {Subject} from "rxjs";
import {BondScreenerService} from "../../services/bond-screener.service";
import {ACTIONS_CONTEXT} from "../../../../shared/services/actions-context";
import {LetDirective} from "@ngrx/component";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives} from "ng-mocks";
import {
  YieldCurveChartParametersComponent
} from "../yield-curve-chart-parameters/yield-curve-chart-parameters.component";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {NzSpinComponent} from "ng-zorro-antd/spin";

describe('YieldCurveChartComponent', () => {
  let component: YieldCurveChartComponent;
  let fixture: ComponentFixture<YieldCurveChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective,
        YieldCurveChartComponent,
        MockComponents(
          YieldCurveChartParametersComponent,
          NzEmptyComponent,
          NzSpinComponent
        ),
        MockDirectives(
          NzResizeObserverDirective
        )
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
    fixture.componentRef.setInput(
      'guid',
      'testGuid'
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
