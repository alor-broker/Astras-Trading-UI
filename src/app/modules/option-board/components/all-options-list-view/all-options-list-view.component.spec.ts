import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {BehaviorSubject, EMPTY, Subject,} from 'rxjs';

import {AllOptionsListViewComponent} from './all-options-list-view.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives, MockProvider} from "ng-mocks";
import {OptionBoardService} from "../../services/option-board.service";
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";
import {QuotesService} from "../../../../shared/services/quotes.service";
import {OptionParameters, OptionSide} from "../../models/option-board.model";
import {
  OptionBoardDataContext,
  OptionsSelection,
  SelectionParameters
} from "../../models/option-board-data-context.model";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {LetDirective} from "@ngrx/component";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {NzSelectComponent} from "ng-zorro-antd/select";
import {InputNumberComponent} from "../../../../shared/components/input-number/input-number.component";
import {PriceDiffComponent} from "../../../../shared/components/price-diff/price-diff.component";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('AllOptionsListViewComponent', () => {
  let component: AllOptionsListViewComponent;
  let fixture: ComponentFixture<AllOptionsListViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AllOptionsListViewComponent,
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        LetDirective,
        MockComponents(
          NzSpinComponent,
          NzEmptyComponent,
          NzSelectComponent,
          InputNumberComponent,
          PriceDiffComponent
        ),
        MockDirectives(
          NzResizeObserverDirective,
          NzIconDirective
        ),
      ],
      providers: [
        MockProvider(
          OptionBoardService,
          {
            getOptionsByExpirationDate: () => EMPTY,
            getExpirations: () => EMPTY,
          }
        ),
        MockProvider(
          WidgetLocalStateService,
          {
            getStateRecord: () => EMPTY,
          }
        ),
        MockProvider(
          QuotesService,
          {
            getQuotes: () => EMPTY,
          }
        )
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AllOptionsListViewComponent);
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
  it('should call updateOptionSelection on updateOptionSelection()', () => {
    const spy = spyOn(component.dataContext, 'updateOptionSelection');
    const optionKey = {symbol: 'SYM', exchange: 'EX'};
    const underlyingAsset = {symbol: 'SYM', minStep: 1} as any;

    (component as any).updateOptionSelection(optionKey, underlyingAsset);
    expect(spy).toHaveBeenCalledWith(optionKey, underlyingAsset);
  });

  it('should update contentSize$ on updateContentSize()', () => {
    const entries = [{
      contentRect: {width: 100, height: 200}
    }] as ResizeObserverEntry[];

    (component as any).updateContentSize(entries);

    component['contentSize$'].subscribe(size => {
      expect(size).toEqual({width: 100, height: 200});
    });
  });

  it('should update layout and save state on changeCellLayout()', fakeAsync(() => {
    const layout = {
      callSideLayout: [
        {displayParameter: OptionParameters.Price, isEditable: true},
        {displayParameter: OptionParameters.Gamma, isEditable: true}
      ],
      putSideLayout: [
        {displayParameter: OptionParameters.Gamma, isEditable: true},
        {displayParameter: OptionParameters.Price, isEditable: true}
      ]
    };

    const layoutSubject = new BehaviorSubject<any>(layout);
    component['rowLayout$'] = layoutSubject.asObservable();

    const setStateSpy = jasmine.createSpy();
    (component as any).widgetLocalStateService.setStateRecord = setStateSpy;

    component['guid'] = 'test-guid';

    (component as any).changeCellLayout(OptionSide.Call, 0, OptionParameters.Delta);

    tick();

    expect(layout.callSideLayout[0].displayParameter).toEqual(OptionParameters.Delta);
    expect(setStateSpy).toHaveBeenCalled();
  }));

  it('should return correct days diff in getDaysToExpirations()', () => {
    const today = new Date();
    const future = new Date(today);
    future.setDate(today.getDate() + 5);

    const diff = component['getDaysToExpirations'](future);
    expect(diff).toBe(5);
  });

  it('should round price correctly in roundPrice()', () => {
    const price = 10.1234242;
    const underlyingAsset = {minStep: 0.05} as any;

    const rounded = component['roundPrice'](price, underlyingAsset);
    expect(rounded).toBe(10.12);
  });

  it('should return null if currentPricePosition cannot be calculated', () => {
    const pos = component['getCurrentPricePosition'](0, [], null, {clientHeight: 100} as HTMLElement);
    expect(pos).toBeNull();
  });

  it('should detect selected option in isOptionSelected()', () => {
    const optionKey = {symbol: 'SYM', exchange: 'EX'};
    const encoded = 'SYM:EX';
    spyOn<any>(component, 'encodeToString').and.returnValue(encoded);

    const selected = new Set<string>([encoded]);
    expect(component['isOptionSelected'](optionKey, selected)).toBeTrue();
  });

  it('should detect highlighted spread in isSpreadHighlighted()', () => {
    (component as any).settingsForm.controls['highlightedSpreadItemsCount'].setValue(1);

    const quotes = {ask: 12, bid: 10} as any;
    const underlyingAsset = {minStep: 1} as any;

    expect(component['isSpreadHighlighted'](quotes, underlyingAsset)).toBeTrue();
  });

  it('should return false for non-highlighted spread in isSpreadHighlighted()', () => {
    (component as any).settingsForm.controls['highlightedSpreadItemsCount'].setValue(100);

    const quotes = {ask: 12, bid: 10} as any;
    const underlyingAsset = {minStep: 1} as any;

    expect(component['isSpreadHighlighted'](quotes, underlyingAsset)).toBeFalse();
  });

  it('should complete subjects on ngOnDestroy()', () => {
    const isLoadingCompleteSpy = spyOn(component['isLoading$'], 'complete');
    const contentSizeCompleteSpy = spyOn(component['contentSize$'], 'complete');

    component.ngOnDestroy();

    expect(isLoadingCompleteSpy).toHaveBeenCalled();
    expect(contentSizeCompleteSpy).toHaveBeenCalled();
  });
});
