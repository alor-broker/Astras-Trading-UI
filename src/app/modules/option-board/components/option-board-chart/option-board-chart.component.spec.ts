import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionBoardChartComponent } from './option-board-chart.component';
import { OptionBoardService } from "../../services/option-board.service";
import {
  of,
  Subject
} from "rxjs";
import { ThemeService } from "../../../../shared/services/theme.service";
import {
  OptionParameters,
  OptionSide
} from "../../models/option-board.model";
import {
  OptionBoardDataContext,
  OptionsSelection,
  SelectionParameters
} from "../../models/option-board-data-context.model";
import { LetDirective } from "@ngrx/component";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";
import { MockComponent } from "ng-mocks";
import { NzSpaceCompactComponent } from "ng-zorro-antd/space";

describe('OptionBoardChartComponent', () => {
  let component: OptionBoardChartComponent;
  let fixture: ComponentFixture<OptionBoardChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LetDirective,
        TranslocoTestsModule.getModule()
      ],
      declarations: [
        OptionBoardChartComponent,
        ...ngZorroMockComponents,
        MockComponent(NzSpaceCompactComponent)
      ],
      providers: [
        {
          provide: OptionBoardService,
          useValue: {
            getPlots: jasmine.createSpy('getPlots').and.returnValue(new Subject())
          }
        },
        {
          provide: ThemeService,
          useValue: {
            getThemeSettings: jasmine.createSpy('getThemeSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: TranslatorService,
          useValue: {
            getTranslator: jasmine.createSpy('getTranslator').and.returnValue(of(() => ''))
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptionBoardChartComponent);
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
