import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoneyWithdrawalComponent } from './money-withdrawal.component';
import { MoneyOperationsService } from '../../../services/money-operations.service';
import { DashboardContextService } from '../../../../../shared/services/dashboard-context.service';
import { of } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockProvider } from 'ng-mocks';
import { PortfolioKey } from "../../../../../shared/models/portfolio-key.model";
import { TranslocoTestsModule } from "../../../../../shared/utils/testing/translocoTestsModule";

describe('MoneyWithdrawalComponent', () => {
  let component: MoneyWithdrawalComponent;
  let fixture: ComponentFixture<MoneyWithdrawalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MoneyWithdrawalComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(MoneyOperationsService),
        MockProvider(DashboardContextService, {
          selectedPortfolio$: of({ portfolio: 'test', exchange: 'test' } as PortfolioKey)
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MoneyWithdrawalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
