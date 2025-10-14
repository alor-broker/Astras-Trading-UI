import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestIdeasCompactComponent } from './invest-ideas-compact.component';
import { MockProvider } from "ng-mocks";
import { HistoryService } from "../../../../shared/services/history.service";
import { EMPTY } from "rxjs";
import { InvestIdeasService } from "../../services/invest-ideas.service";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('InvestIdeasCompactComponent', () => {
  let component: InvestIdeasCompactComponent;
  let fixture: ComponentFixture<InvestIdeasCompactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InvestIdeasCompactComponent,
        TranslocoTestsModule.getModule()
      ],
      providers:[
        MockProvider(
          HistoryService,
          {
            getLastTwoCandles: () => EMPTY
          }
        ),
        MockProvider(
          InvestIdeasService,
          {
            getIdeas: () => EMPTY
          }
        ),
        MockProvider(InstrumentsService)
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestIdeasCompactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
