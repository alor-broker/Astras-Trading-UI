import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentSelectDialogWidgetComponent } from './instrument-select-dialog-widget.component';
import {
  MockComponents,
  MockProvider
} from "ng-mocks";
import { SearchResultsListComponent } from "../../components/search-results-list/search-results-list.component";
import { MarketService } from "../../../../shared/services/market.service";
import { EMPTY } from "rxjs";
import { BoardsService } from "../../../all-instruments/services/boards.service";
import { InstrumentSelectDialogService } from "../../services/instrument-select-dialog.service";
import { SearchInstrumentStore } from "../../utils/search-instrument-store";

describe('InstrumentSelectDialogWidgetComponent', () => {
  let component: InstrumentSelectDialogWidgetComponent;
  let fixture: ComponentFixture<InstrumentSelectDialogWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InstrumentSelectDialogWidgetComponent,
        ...MockComponents(
          SearchResultsListComponent
        )
      ],
      providers: [
        MockProvider(
          MarketService,
          {
            getAllExchanges: () => EMPTY
          }
        ),
        MockProvider(
          BoardsService,
          {
            getAllBoards: () => EMPTY
          }
        ),
        MockProvider(
          InstrumentSelectDialogService,
          {
            selectParams$: EMPTY
          }
        ),
      ]
    })
    .compileComponents();

    TestBed.overrideComponent(
      InstrumentSelectDialogWidgetComponent,
      {
        set: {
          providers: [
            MockProvider(
              SearchInstrumentStore
            ),
          ]
        }
      }
    );

    fixture = TestBed.createComponent(InstrumentSelectDialogWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
