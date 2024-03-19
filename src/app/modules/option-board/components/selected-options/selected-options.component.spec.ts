import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectedOptionsComponent } from './selected-options.component';
import { Subject } from "rxjs";
import { OptionParameters, OptionSide } from "../../models/option-board.model";
import { OptionBoardDataContext, OptionsSelection } from "../../models/option-board-data-context.model";
import { getTranslocoModule } from "../../../../shared/utils/testing";
import { OptionBoardService } from "../../services/option-board.service";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { ACTIONS_CONTEXT } from "../../../../shared/services/actions-context";
import { LetDirective } from "@ngrx/component";

describe('SelectedOptionsComponent', () => {
  let component: SelectedOptionsComponent;
  let fixture: ComponentFixture<SelectedOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        LetDirective
      ],
      declarations: [ SelectedOptionsComponent ],
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
      updateOptionSelection: () => {
      },
      clearCurrentSelection: () => {
      },
      removeItemFromSelection: () => {
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
