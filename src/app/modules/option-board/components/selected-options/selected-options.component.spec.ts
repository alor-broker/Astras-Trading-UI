import {ComponentFixture, TestBed} from '@angular/core/testing';

import {SelectedOptionsComponent} from './selected-options.component';
import {EMPTY, Observable, Subject} from "rxjs";
import {OptionParameters, OptionSide} from "../../models/option-board.model";
import {
  OptionBoardDataContext,
  OptionsSelection,
  SelectionParameters
} from "../../models/option-board-data-context.model";
import {OptionBoardService} from "../../services/option-board.service";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {ACTIONS_CONTEXT} from "../../../../shared/services/actions-context";
import {LetDirective} from "@ngrx/component";
import {NzContextMenuService} from "ng-zorro-antd/dropdown";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {
  NzCellFixedDirective,
  NzTableCellDirective,
  NzTableComponent,
  NzTableVirtualScrollDirective,
  NzTbodyComponent,
  NzTheadComponent,
  NzThMeasureDirective,
  NzTrDirective
} from "ng-zorro-antd/table";
import {TableRowHeightDirective} from "../../../../shared/directives/table-row-height.directive";
import {NzPopconfirmDirective} from "ng-zorro-antd/popconfirm";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {InputNumberComponent} from "../../../../shared/components/input-number/input-number.component";
import {NzDescriptionsComponent, NzDescriptionsItemComponent} from "ng-zorro-antd/descriptions";
import {NzPopoverDirective} from "ng-zorro-antd/popover";
import {
  AddToWatchlistMenuComponent
} from "../../../instruments/widgets/add-to-watchlist-menu/add-to-watchlist-menu.component";
import {TranslatorFn, TranslatorService} from "../../../../shared/services/translator.service";

describe('SelectedOptionsComponent', () => {
  let component: SelectedOptionsComponent;
  let fixture: ComponentFixture<SelectedOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective,
        SelectedOptionsComponent,
        MockComponents(
          NzEmptyComponent,
          NzTableComponent,
          NzTheadComponent,
          NzTbodyComponent,
          InputNumberComponent,
          NzDescriptionsComponent,
          NzDescriptionsItemComponent,
          AddToWatchlistMenuComponent
        ),
        MockDirectives(
          NzResizeObserverDirective,
          TableRowHeightDirective,
          NzTrDirective,
          NzTableCellDirective,
          NzThMeasureDirective,
          NzCellFixedDirective,
          NzPopconfirmDirective,
          NzTooltipDirective,
          NzTableVirtualScrollDirective,
          NzIconDirective,
          NzPopoverDirective
        )
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
        {
          provide: TranslatorService,
          useValue: {
            getTranslator: (): Observable<TranslatorFn> => EMPTY
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SelectedOptionsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      'dataContext',
      {
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
      } as OptionBoardDataContext
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
