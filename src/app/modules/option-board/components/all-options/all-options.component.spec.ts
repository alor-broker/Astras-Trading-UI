import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AllOptionsComponent} from './all-options.component';
import {getTranslocoModule, ngZorroMockComponents} from "../../../../shared/utils/testing";
import {OptionBoardService} from "../../services/option-board.service";
import {Subject} from "rxjs";
import {OptionParameters, OptionSide} from "../../models/option-board.model";
import {OptionBoardDataContext, OptionsSelection} from "../../models/option-board-data-context.model";

describe('AllOptionsComponent', () => {
  let component: AllOptionsComponent;
  let fixture: ComponentFixture<AllOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [
        AllOptionsComponent,
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: OptionBoardService,
          useValue: {
            getInstrumentOptions: jasmine.createSpy('getInstrumentOptions').and.returnValue(new Subject())
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AllOptionsComponent);
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
