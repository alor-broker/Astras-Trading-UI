import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoneyInputComponent } from './money-input.component';
import { MoneyOperationsService } from '../../../../shared/services/money-operations.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { UserPortfoliosService } from '../../../../shared/services/user-portfolios.service';
import { of } from 'rxjs';
import { TranslocoDirective, provideTransloco } from '@jsverse/transloco';

describe('MoneyInputComponent', () => {
  let component: MoneyInputComponent;
  let fixture: ComponentFixture<MoneyInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoneyInputComponent, TranslocoDirective],
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
        {
          provide: UserPortfoliosService,
          useValue: {
            getPortfolios: jasmine.createSpy('getPortfolios').and.returnValue(of([]))
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

    fixture = TestBed.createComponent(MoneyInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
