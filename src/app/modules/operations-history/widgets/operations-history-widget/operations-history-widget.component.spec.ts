import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OperationsHistoryWidgetComponent } from './operations-history-widget.component';
import { WidgetInstance } from '../../../../shared/models/dashboard/dashboard-item.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { OperationsHistoryComponent } from '../../components/operations-history/operations-history.component';
import { OperationsHistoryService } from '../../../../shared/services/operations-history.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { UserPortfoliosService } from '../../../../shared/services/user-portfolios.service';
import { of } from 'rxjs';
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('OperationsHistoryWidgetComponent', () => {
  let component: OperationsHistoryWidgetComponent;
  let fixture: ComponentFixture<OperationsHistoryWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OperationsHistoryWidgetComponent,
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
    })
    .overrideComponent(OperationsHistoryWidgetComponent, {
      set: {
        imports: [
          MockComponent(OperationsHistoryComponent)
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperationsHistoryWidgetComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('widgetInstance', {
      instance: {
        guid: '123'
      }
    } as WidgetInstance);
    fixture.componentRef.setInput('isBlockWidget', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
