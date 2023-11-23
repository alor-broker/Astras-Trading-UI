import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { CorrelationChartComponent } from './correlation-chart.component';
import { Subject } from "rxjs";
import { InstrumentsCorrelationService } from "../../services/instruments-correlation.service";
import {
  getTranslocoModule,
  mockComponent,
  ngZorroMockComponents
} from "../../../../shared/utils/testing";
import { LetDirective } from "@ngrx/component";
import { GuidGenerator } from "../../../../shared/utils/guid";

describe('CorrelationChartComponent', () => {
  let component: CorrelationChartComponent;
  let fixture: ComponentFixture<CorrelationChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        LetDirective
      ],
      declarations: [
        CorrelationChartComponent,
        mockComponent({
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
