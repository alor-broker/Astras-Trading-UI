import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OperationsHistoryComponent } from './operations-history.component';
import { OperationsHistoryService } from '../../../../shared/services/operations-history.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { UserPortfoliosService } from '../../../../shared/services/user-portfolios.service';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockProvider } from 'ng-mocks';
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('OperationsHistoryComponent', () => {
  let component: OperationsHistoryComponent;
  let fixture: ComponentFixture<OperationsHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OperationsHistoryComponent,
        NoopAnimationsModule,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(OperationsHistoryService, {
          getHistory: () => of([])
        }),
        MockProvider(DashboardContextService, {
          selectedPortfolio$: of({ portfolio: 'test', exchange: 'test' } as PortfolioKey)
        }),
        MockProvider(UserPortfoliosService, {
          getPortfolios: () => of([])
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OperationsHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
