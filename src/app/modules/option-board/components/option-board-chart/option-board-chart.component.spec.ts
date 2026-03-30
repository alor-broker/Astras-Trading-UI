import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OptionBoardChartComponent} from './option-board-chart.component';
import {OptionBoardService} from "../../services/option-board.service";
import {of, Subject} from "rxjs";
import {ThemeService} from "../../../../shared/services/theme.service";
import {OptionParameters, OptionSide} from "../../models/option-board.model";
import {
  OptionBoardDataContext,
  OptionsSelection,
  SelectionParameters
} from "../../models/option-board-data-context.model";
import {LetDirective} from "@ngrx/component";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzSpaceCompactComponent} from "ng-zorro-antd/space";
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {NzOptionComponent, NzSelectComponent} from "ng-zorro-antd/select";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {BaseChartDirective} from "ng2-charts";

describe('OptionBoardChartComponent', () => {
  let component: OptionBoardChartComponent;
  let fixture: ComponentFixture<OptionBoardChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LetDirective,
        TranslocoTestsModule.getModule(),
        OptionBoardChartComponent,
        MockComponents(
          NzSpinComponent,
          NzSelectComponent,
          NzOptionComponent,
          NzSpaceCompactComponent,
          NzButtonComponent,
          NzEmptyComponent
        ),
        MockDirectives(
          NzIconDirective,
          BaseChartDirective,
        )
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
