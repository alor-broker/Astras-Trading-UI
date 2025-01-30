import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PortfolioDynamicsComponent} from './portfolio-dynamics.component';
import {MockProvider} from "ng-mocks";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {EMPTY} from "rxjs";
import {UserPortfoliosService} from "../../../../shared/services/user-portfolios.service";
import {ThemeService} from "../../../../shared/services/theme.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {AccountService} from "../../../../shared/services/account.service";

describe('PortfolioDynamicsComponent', () => {
  let component: PortfolioDynamicsComponent;
  let fixture: ComponentFixture<PortfolioDynamicsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PortfolioDynamicsComponent,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(
          DashboardContextService,
          {
            selectedPortfolio$: EMPTY
          }
        ),
        MockProvider(
          UserPortfoliosService,
          {
            getPortfolios: () => EMPTY
          }
        ),
        MockProvider(
          ThemeService,
          {
            getThemeSettings: () => EMPTY
          }
        )
      ]
    })
      .compileComponents();

    TestBed.overrideComponent(
      PortfolioDynamicsComponent,
      {
        set: {
          providers: [
            // Аor unknown reasons this service is not ьщслув in configureTestingModule method.
            // Probably because of providedIn: 'any' option
            MockProvider(
              AccountService,
              {
                getPortfolioDynamicsForAgreement: () => EMPTY
              }
            )
          ]
        }
      }
    );

    fixture = TestBed.createComponent(PortfolioDynamicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
