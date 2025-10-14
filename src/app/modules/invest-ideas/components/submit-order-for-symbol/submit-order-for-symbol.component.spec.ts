import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { SubmitOrderForSymbolComponent } from './submit-order-for-symbol.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import {
  MockComponents,
  MockProvider
} from "ng-mocks";
import { CompactHeaderComponent } from "../../../order-commands/components/compact-header/compact-header.component";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { EMPTY } from "rxjs";
import { InstrumentsService } from "../../../instruments/services/instruments.service";

describe('SubmitOrderForSymbolComponent', () => {
  let component: SubmitOrderForSymbolComponent;
  let fixture: ComponentFixture<SubmitOrderForSymbolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SubmitOrderForSymbolComponent,
        TranslocoTestsModule.getModule(),
        MockComponents(
          CompactHeaderComponent
        )
      ],
      providers: [
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

    fixture = TestBed.createComponent(SubmitOrderForSymbolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
