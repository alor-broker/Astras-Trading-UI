import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioEvaluationComponent } from './portfolio-evaluation.component';
import { MockProvider } from "ng-mocks";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { EMPTY } from "rxjs";
import { PortfolioSummaryService } from "../../../../shared/services/portfolio-summary.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('PortfolioEvaluationComponent', () => {
  let component: PortfolioEvaluationComponent;
  let fixture: ComponentFixture<PortfolioEvaluationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        PortfolioEvaluationComponent
      ],
      providers: [
        MockProvider(
          DashboardContextService,
          {
            selectedPortfolio$: EMPTY
          }
        ),
        MockProvider(
          PortfolioSummaryService,
          {
            getCommonSummary: () => EMPTY,
            getForwardRisks: () => EMPTY
          }
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioEvaluationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
