import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { AllOptionsComponent } from './all-options.component';
import { OptionBoardService } from "../../services/option-board.service";
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
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";

describe('AllOptionsComponent', () => {
  let component: AllOptionsComponent;
  let fixture: ComponentFixture<AllOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslocoTestsModule.getModule()],
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
