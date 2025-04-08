import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { AllOptionsListViewComponent } from './all-options-list-view.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { MockProvider } from "ng-mocks";
import { OptionBoardService } from "../../services/option-board.service";
import {
  EMPTY,
  Subject
} from "rxjs";
import { WidgetLocalStateService } from "../../../../shared/services/widget-local-state.service";
import { QuotesService } from "../../../../shared/services/quotes.service";
import {
  OptionParameters,
  OptionSide
} from "../../models/option-board.model";
import {
  OptionBoardDataContext,
  OptionsSelection,
  SelectionParameters
} from "../../models/option-board-data-context.model";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

describe('AllOptionsListViewComponent', () => {
  let component: AllOptionsListViewComponent;
  let fixture: ComponentFixture<AllOptionsListViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AllOptionsListViewComponent,
        TranslocoTestsModule.getModule(),
        BrowserAnimationsModule
      ],
      providers: [
        MockProvider(
          OptionBoardService,
          {
            getOptionsByExpirationDate: () => EMPTY,
            getExpirations: () => EMPTY,
          }
        ),
        MockProvider(
          WidgetLocalStateService,
          {
            getStateRecord: () => EMPTY,
          }
        ),
        MockProvider(
          QuotesService,
          {
            getQuotes: () => EMPTY,
          }
        )
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AllOptionsListViewComponent);
    component = fixture.componentInstance;

    component.dataContext = {
      settings$: new Subject(),
      selectedSide$: new Subject<OptionSide>(),
      selectedParameter$: new Subject<OptionParameters>(),
      optionsSelection$: new Subject<OptionsSelection[]>(),
      currentSelection$: new Subject<OptionsSelection>(),
      selectionParameters$: new Subject<Map<string, Partial<SelectionParameters>>>(),
      updateOptionSelection: () => {
      },
      clearCurrentSelection: () => {
      },
      removeItemFromSelection: () => {
      },
      setParameters: () => {
      },
      destroy: () => {
      }
    } as OptionBoardDataContext;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
