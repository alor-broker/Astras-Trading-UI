import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { CorrelationChartComponent } from './correlation-chart.component';
import { Subject } from "rxjs";
import { InstrumentsCorrelationService } from "../../services/instruments-correlation.service";
import { LetDirective } from "@ngrx/component";
import { GuidGenerator } from "../../../../shared/utils/guid";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";

describe('CorrelationChartComponent', () => {
  let component: CorrelationChartComponent;
  let fixture: ComponentFixture<CorrelationChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective
      ],
      declarations: [
        CorrelationChartComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-chart-filters',
          inputs: ['guid']
        }),
        ...ngZorroMockComponents
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
    component.guid = GuidGenerator.newGuid();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
