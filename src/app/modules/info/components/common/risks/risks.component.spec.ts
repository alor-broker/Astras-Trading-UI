import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { RisksComponent } from './risks.component';
import { DashboardContextService } from "../../../../../shared/services/dashboard-context.service";
import { TranslocoTestsModule } from "../../../../../shared/utils/testing/translocoTestsModule";
import { MockProvider } from "ng-mocks";
import { RisksService } from "../../../services/risks.service";
import { NEVER } from "rxjs";

describe('RisksComponent', () => {
  let component: RisksComponent;
  let fixture: ComponentFixture<RisksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RisksComponent,
        TranslocoTestsModule.getModule(),
      ],
      providers: [
        MockProvider(
          DashboardContextService,
          {
            selectedPortfolio$: NEVER
          }
        ),
        MockProvider(
          RisksService,
          {
            getRisksInfo: () => NEVER
          }
        ),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RisksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
