import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OpenOrdersDialogNavBtnComponent} from './open-orders-dialog-nav-btn.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockProvider} from "ng-mocks";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {EMPTY} from "rxjs";
import {provideHttpClient} from "@angular/common/http";

describe('OpenOrdersDialogNavBtnComponent', () => {
  let component: OpenOrdersDialogNavBtnComponent;
  let fixture: ComponentFixture<OpenOrdersDialogNavBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OpenOrdersDialogNavBtnComponent,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(OrdersDialogService),
        MockProvider(
          DashboardContextService,
          {
            selectedDashboard$: EMPTY
          }
        ),
        provideHttpClient()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OpenOrdersDialogNavBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
