import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoneyWithdrawalComponent } from './money-withdrawal.component';
import { MoneyOperationsService } from '../../../../shared/services/money-operations.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { of } from 'rxjs';
import { TranslocoDirective, provideTransloco } from '@jsverse/transloco';

describe('MoneyWithdrawalComponent', () => {
  let component: MoneyWithdrawalComponent;
  let fixture: ComponentFixture<MoneyWithdrawalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoneyWithdrawalComponent, TranslocoDirective],
      providers: [
        {
          provide: MoneyOperationsService,
          useValue: {}
        },
        {
          provide: DashboardContextService,
          useValue: {
            selectedPortfolio$: of(null)
          }
        },
        provideTransloco({
          config: {
            availableLangs: ['en', 'ru'],
            defaultLang: 'en',
          },
          loader: {} as any
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
