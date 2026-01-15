import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CorrelationChartComponent} from './correlation-chart.component';
import {Subject} from "rxjs";
import {InstrumentsCorrelationService} from "../../services/instruments-correlation.service";
import {LetDirective} from "@ngrx/component";
import {GuidGenerator} from "../../../../shared/utils/guid";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives} from "ng-mocks";
import {ChartFiltersComponent} from "../chart-filters/chart-filters.component";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {NzSpinComponent} from "ng-zorro-antd/spin";

describe('CorrelationChartComponent', () => {
  let component: CorrelationChartComponent;
  let fixture: ComponentFixture<CorrelationChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective,
        CorrelationChartComponent,
        MockComponents(
          ChartFiltersComponent,
          NzEmptyComponent,
          NzSpinComponent
        ),
        MockDirectives(
          NzResizeObserverDirective
        )
      ],
      providers: [
        {
          provide: InstrumentsCorrelationService,
          useValue: {
            getCorrelation: jasmine.createSpy('getCorrelation').and.returnValue(new Subject())
          }
        }
      ]
    });
    fixture = TestBed.createComponent(CorrelationChartComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
