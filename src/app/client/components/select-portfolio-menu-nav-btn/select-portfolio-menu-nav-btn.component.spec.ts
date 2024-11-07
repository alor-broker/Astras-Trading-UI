import {ComponentFixture, TestBed} from '@angular/core/testing';

import {SelectPortfolioMenuNavBtnComponent} from './select-portfolio-menu-nav-btn.component';
import {TranslocoTestsModule} from "../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirective, MockProvider} from "ng-mocks";
import {EnvironmentService} from "../../../shared/services/environment.service";
import {DashboardContextService} from "../../../shared/services/dashboard-context.service";
import {EMPTY} from "rxjs";
import {StoreModule} from "@ngrx/store";
import {PortfoliosFeature} from "../../../store/portfolios/portfolios.reducer";
import {
  EmptyPortfoliosWarningModalComponent
} from "../empty-portfolios-warning-modal/empty-portfolios-warning-modal.component";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('SelectPortfolioMenuNavBtnComponent', () => {
  let component: SelectPortfolioMenuNavBtnComponent;
  let fixture: ComponentFixture<SelectPortfolioMenuNavBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SelectPortfolioMenuNavBtnComponent,
        TranslocoTestsModule.getModule(),
        StoreModule.forRoot(),
        StoreModule.forFeature(PortfoliosFeature),
        ...MockComponents(
          EmptyPortfoliosWarningModalComponent
        ),
        MockDirective(NzIconDirective)
      ],
      providers: [
        MockProvider(
          EnvironmentService,
          {
            externalLinks: {
              reports: '',
              releases: '',
              support: '',
              issuesList: '',
              help: '',
              officialSite: '',
              riskRate: '',
              personalAccount: '',
              bankroll: '',
              services: '',
              videoTutorial: '',
            }
          }
        ),
        MockProvider(
          DashboardContextService,
          {
            selectedDashboard$: EMPTY,
            selectDashboardPortfolio: () => {
            }
          }
        )
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SelectPortfolioMenuNavBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
