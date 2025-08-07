import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmitOrderForIdeaComponent } from './submit-order-for-idea.component';
import {
  MockComponents,
  MockProvider
} from "ng-mocks";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { CompactHeaderComponent } from "../../../order-commands/components/compact-header/compact-header.component";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { EMPTY } from "rxjs";
import { InstrumentsService } from "../../../instruments/services/instruments.service";

describe('SubmitOrderForIdeaComponent', () => {
  let component: SubmitOrderForIdeaComponent;
  let fixture: ComponentFixture<SubmitOrderForIdeaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SubmitOrderForIdeaComponent,
        TranslocoTestsModule.getModule(),
        MockComponents(
          CompactHeaderComponent
        )
      ],
      providers:[
        MockProvider(
          DashboardContextService,
          {
            selectedPortfolio$: EMPTY
          }
        ),
        MockProvider(
          InstrumentsService,
          {
            getInstrument: () => EMPTY
          }
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubmitOrderForIdeaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
