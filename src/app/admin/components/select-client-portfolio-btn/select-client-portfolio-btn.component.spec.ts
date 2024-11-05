import {ComponentFixture, TestBed} from '@angular/core/testing';

import {SelectClientPortfolioBtnComponent} from './select-client-portfolio-btn.component';
import {StoreModule} from "@ngrx/store";
import {MockComponents, MockDirective, MockProvider} from "ng-mocks";
import {ManageDashboardsService} from "../../../shared/services/manage-dashboards.service";
import {TranslocoTestsModule} from "../../../shared/utils/testing/translocoTestsModule";
import {
  SearchClientPortfolioDialogComponent
} from "../search-client-portfolio-dialog/search-client-portfolio-dialog.component";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('SelectClientPortfolioBtnComponent', () => {
  let component: SelectClientPortfolioBtnComponent;
  let fixture: ComponentFixture<SelectClientPortfolioBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        SelectClientPortfolioBtnComponent,
        StoreModule.forRoot(),
        ...MockComponents(
          SearchClientPortfolioDialogComponent
        ),
        MockDirective(NzIconDirective)
      ],
      providers: [
        MockProvider(ManageDashboardsService)
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SelectClientPortfolioBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
