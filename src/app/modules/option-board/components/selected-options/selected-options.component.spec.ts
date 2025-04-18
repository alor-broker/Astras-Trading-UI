import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { SelectedOptionsComponent } from './selected-options.component';
import { Subject } from "rxjs";
import {
  OptionParameters,
  OptionSide
} from "../../models/option-board.model";
import {
  OptionBoardDataContext,
  OptionsSelection,
  SelectionParameters
} from "../../models/option-board-data-context.model";
import { OptionBoardService } from "../../services/option-board.service";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { ACTIONS_CONTEXT } from "../../../../shared/services/actions-context";
import { LetDirective } from "@ngrx/component";
import { NzContextMenuService } from "ng-zorro-antd/dropdown";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";

describe('SelectedOptionsComponent', () => {
  let component: SelectedOptionsComponent;
  let fixture: ComponentFixture<SelectedOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective
      ],
      declarations: [
        SelectedOptionsComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-input-number',
          inputs: ['step', 'allowNegative', 'allowDecimal', 'initialValue']
        }),
        ComponentHelpers.mockComponent({
          selector: 'ats-add-to-watchlist-menu'
        })
      ],
      providers: [
        {
          provide: OptionBoardService,
          useValue: {
            getOptionDetails: jasmine.createSpy('getOptionDetails').and.returnValue(new Subject())
          }
        },
        {
          provide: WidgetSettingsService,
          useValue: {
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough(),
          }
        },
        {
          provide: ACTIONS_CONTEXT,
          useValue: {
            instrumentSelected: jasmine.createSpy('instrumentSelected').and.callThrough()
          }
        },
        {
          provide: NzContextMenuService,
          useValue: {
            create: jasmine.createSpy('create').and.callThrough(),
            close: jasmine.createSpy('close').and.callThrough()
          }
        },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectedOptionsComponent);
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
