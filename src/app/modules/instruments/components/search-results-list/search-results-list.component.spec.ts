import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchResultsListComponent } from './search-results-list.component';
import { MockProvider } from "ng-mocks";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { EMPTY } from "rxjs";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('SearchResultsListComponent', () => {
  let component: SearchResultsListComponent;
  let fixture: ComponentFixture<SearchResultsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SearchResultsListComponent,
        TranslocoTestsModule.getModule()
      ],
      providers:[
        MockProvider(
          TerminalSettingsService,
    {
            getSettings: () => EMPTY
          }
        ),
        MockProvider(
          DashboardContextService,
    {
            instrumentsSelection$: EMPTY
    }
      )
      ]
        })
    .compileComponents();

    fixture = TestBed.createComponent(SearchResultsListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
