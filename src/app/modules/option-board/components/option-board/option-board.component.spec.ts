import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OptionBoardComponent} from './option-board.component';
import {OptionBoardDataContextFactory} from "../../utils/option-board-data-context-factory";
import {EMPTY, Subject} from "rxjs";
import {OptionParameters, OptionSide} from "../../models/option-board.model";
import {OptionsSelection} from "../../models/option-board-data-context.model";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockProvider} from "ng-mocks";
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";
import {LetDirective} from "@ngrx/component";
import {NzOptionComponent, NzSelectComponent} from "ng-zorro-antd/select";
import {ViewSelectorComponent} from "../view-selector/view-selector.component";
import {ViewSelectorItemComponent} from "../view-selector-item/view-selector-item.component";
import {AllOptionsComponent} from "../all-options/all-options.component";
import {AllOptionsListViewComponent} from "../all-options-list-view/all-options-list-view.component";
import {SelectedOptionsComponent} from "../selected-options/selected-options.component";
import {OptionBoardChartsLayoutComponent} from "../option-board-charts-layout/option-board-charts-layout.component";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('OptionBoardComponent', () => {
  let component: OptionBoardComponent;
  let fixture: ComponentFixture<OptionBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective,
        OptionBoardComponent,
        MockComponents(
          NzSelectComponent,
          NzOptionComponent,
          ViewSelectorComponent,
          ViewSelectorItemComponent,
          AllOptionsComponent,
          AllOptionsListViewComponent,
          SelectedOptionsComponent,
          OptionBoardChartsLayoutComponent,
        )
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
        MockProvider(WidgetLocalStateService, {
          getStateRecord: () => EMPTY,
        })
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OptionBoardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
