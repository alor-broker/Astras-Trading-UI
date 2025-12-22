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
import {MockComponents} from "ng-mocks";
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {OptionPreviewComponent} from "../option-preview/option-preview.component";

describe('AllOptionsComponent', () => {
  let component: AllOptionsComponent;
  let fixture: ComponentFixture<AllOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [
      TranslocoTestsModule.getModule(),
      AllOptionsComponent,
      MockComponents(
        NzSpinComponent,
        NzEmptyComponent,
        NzTypographyComponent,
        OptionPreviewComponent
      )
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
