import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { OptionBoardComponent } from './option-board.component';
import { OptionBoardDataContextFactory } from "../../utils/option-board-data-context-factory";
import {
  EMPTY,
  Subject
} from "rxjs";
import {
  OptionParameters,
  OptionSide
} from "../../models/option-board.model";
import { OptionsSelection } from "../../models/option-board-data-context.model";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";
import { MockProvider } from "ng-mocks";
import { WidgetLocalStateService } from "../../../../shared/services/widget-local-state.service";
import { LetDirective } from "@ngrx/component";

describe('OptionBoardComponent', () => {
  let component: OptionBoardComponent;
  let fixture: ComponentFixture<OptionBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective
      ],
      declarations: [
        OptionBoardComponent,
        ...ngZorroMockComponents,
        ComponentHelpers.mockComponent({
          selector: 'ats-all-options',
          inputs: ['dataContext']
        }),
        ComponentHelpers.mockComponent({
          selector: 'ats-selected-options',
          inputs: ['dataContext']
        }),
        ComponentHelpers.mockComponent({
          selector: 'ats-option-board-charts-layout',
          inputs: ['dataContext']
        }),
        ComponentHelpers.mockComponent({
          selector: 'ats-all-options-list-view',
          inputs: ['dataContext', 'guid']
        })
      ],
      providers: [
        {
          provide: OptionBoardDataContextFactory,
          useValue: {
            create: jasmine.createSpy('create').and.returnValue({
              settings$: new Subject(),
              selectedSide$: new Subject<OptionSide>(),
              selectedParameter$: new Subject<OptionParameters>(),
              optionsSelection$: new Subject<OptionsSelection[]>(),
              currentSelection$: new Subject<OptionsSelection>(),
              updateOptionSelection: () => {
              },
              clearCurrentSelection: () => {
              },
              removeItemFromSelection: () => {
              },
              destroy: () => {
              }
            })
          }
        },
        MockProvider(
          WidgetLocalStateService,
          {
            getStateRecord: () => EMPTY,
          }
        )
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OptionBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
