import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoneyInputComponent } from './money-input.component';
import { MoneyOperationsService } from '../../../../../shared/services/money-operations.service';
import { DashboardContextService } from '../../../../../shared/services/dashboard-context.service';
import { UserPortfoliosService } from '../../../../../shared/services/user-portfolios.service';
import { of } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockProvider } from 'ng-mocks';
import { PortfolioKey } from "../../../../../shared/models/portfolio-key.model";
import { TranslocoTestsModule } from "../../../../../shared/utils/testing/translocoTestsModule";
import { NzIconModule } from 'ng-zorro-antd/icon';
import { IconDefinition } from '@ant-design/icons-angular';
import { CreditCardOutline, SwapOutline, BankOutline, ArrowLeftOutline } from '@ant-design/icons-angular/icons';

const icons: IconDefinition[] = [
  CreditCardOutline,
  SwapOutline,
  BankOutline,
  ArrowLeftOutline
];

describe('MoneyInputComponent', () => {
  let component: MoneyInputComponent;
  let fixture: ComponentFixture<MoneyInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MoneyInputComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        TranslocoTestsModule.getModule(),
        NzIconModule.forRoot(icons)
      ],
      providers: [
        MockProvider(MoneyOperationsService),
        MockProvider(DashboardContextService, {
          selectedPortfolio$: of({ portfolio: 'test', exchange: 'test' } as PortfolioKey)
        }),
        MockProvider(UserPortfoliosService, {
          getPortfolios: () => of([])
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MoneyInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
