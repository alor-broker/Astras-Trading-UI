import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OperationsHistoryComponent } from './operations-history.component';
import { OperationsHistoryService } from '../../../../shared/services/operations-history.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { of } from 'rxjs';
import { provideTransloco } from '@jsverse/transloco';

describe('OperationsHistoryComponent', () => {
  let component: OperationsHistoryComponent;
  let fixture: ComponentFixture<OperationsHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationsHistoryComponent],
      providers: [
        {
          provide: OperationsHistoryService,
          useValue: {
            getHistory: jasmine.createSpy('getHistory').and.returnValue(of({ items: [], total: 0 }))
          }
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

    fixture = TestBed.createComponent(OperationsHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
