import {
  ComponentFixture, fakeAsync,
  TestBed, tick
} from '@angular/core/testing';

import { BaseTableComponent } from "./base-table.component";
import { Component, DestroyRef, ElementRef, QueryList, ViewChild, ViewChildren } from "@angular/core";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterService } from "../../services/blotter.service";
import { NzTableComponent } from "ng-zorro-antd/table";
import { getRandomInt, getTranslocoModule, ngZorroMockComponents } from "../../../../shared/utils/testing";
import { By } from "@angular/platform-browser";
import { BehaviorSubject, take } from "rxjs";
import { TableNames } from "../../models/blotter-settings.model";
import { TranslatorService } from "../../../../shared/services/translator.service";

@Component({
  selector: 'ats-test-comp',
  template: `
    <div #tableContainer class="table-container" [style]="{ height: containerHeight + 'px', display: 'block'}">
      <nz-table #nzTable  [style]="{display: 'block'}"></nz-table>
      <div class="table" [style]="{display: 'block'}"></div>
    </div>
  `
})
class TestComponent extends BaseTableComponent<{ id: string }, {}> {
  @ViewChild('nzTable')
  table?: NzTableComponent<any>;

  @ViewChildren('tableContainer')
  tableContainer!: QueryList<ElementRef<HTMLElement>>;

  settingsTableName = TableNames.OrdersTable;

  containerHeight = 0;

  constructor(
    protected readonly service: BlotterService,
    protected readonly settingsService: WidgetSettingsService,
    protected readonly translatorService: TranslatorService,
    protected readonly destroyRef: DestroyRef
  ) {
    super(service, settingsService, translatorService, destroyRef);
  }
}

@Component({
  template: '<ats-test-comp [guid]="guid"></ats-test-comp>'
})
class TestWrapperComponent {
  guid = 'testGuid';
}

describe('BaseTableComponent', () => {
  let hostComponent: TestWrapperComponent;
  let component: any;
  let hostFixture: ComponentFixture<TestWrapperComponent>;

  let blotterServiceSpy: any;
  let settingsServiceSpy: any;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    blotterServiceSpy = jasmine.createSpyObj('BlotterService', ['selectNewInstrument']);
    settingsServiceSpy = jasmine.createSpyObj('WidgetSettingsService', ['getSettings', 'updateSettings']);

    await TestBed.configureTestingModule({
      declarations: [
        TestComponent,
        TestWrapperComponent,
        ...ngZorroMockComponents
      ],
      imports: [
        getTranslocoModule(),
      ],
      providers: [
        { provide: BlotterService, useValue: blotterServiceSpy },
        { provide: WidgetSettingsService, useValue: settingsServiceSpy }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    hostFixture = TestBed.createComponent(TestWrapperComponent);
    hostComponent = hostFixture.componentInstance;
    component = hostFixture.debugElement.query(By.directive(TestComponent)).componentInstance;
    hostFixture.detectChanges();
  });

  afterEach(() => hostFixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // it('should detect table container height change', fakeAsync(() => {
  //   const expectedHeight = getRandomInt(150, 200);
  //
  //   const container = hostFixture.debugElement.query(By.css('.table-container'));
  //   container.nativeElement.style.height = expectedHeight + 'px';
  //   hostFixture.detectChanges();
  //   tick();
  //
  //   container.nativeElement.dispatchEvent(new Event('resize'));
  //
  //   tick();
  //
  //   component.scrollHeight$
  //     .subscribe((x: number) =>{
  //       expect(x).toBe(expectedHeight);
  //     });
  //
  // }));

  it('should change filter', fakeAsync(() => {
    const expectedFilter: any = { key1: 'val1', key2: ['val2'] };
    component.filterChange(expectedFilter);

    tick();

    component.filter$
      .pipe(take(1))
      .subscribe((f: any) => expect(f).toEqual(expectedFilter));

    expectedFilter.key1 = 'val3';
    expectedFilter.newKey = 'newVal';
    component.filterChange(expectedFilter);

    tick();

    component.filter$
      .pipe(take(1))
      .subscribe((f: any) => expect(f).toEqual(expectedFilter));
  }));

  it('should change default filter', () => {
    const filterChangeSpy = spyOn(component, 'filterChange').and.callThrough();

    component.defaultFilterChange('testKey', ['testValue']);
    expect(filterChangeSpy).toHaveBeenCalledOnceWith({ testKey: ['testValue'] });
  });

  it('should reset filter', fakeAsync(() => {
    component.filterChange({ key1: 'val1'});
    tick();
    component.reset();
    tick();

    component.filter$
      .pipe(take(1))
      .subscribe((f: any) => expect(f).toEqual({}));
  }));

  it('should select instrument', () => {
    blotterServiceSpy.selectNewInstrument.and.callThrough();

    const expectedSymbol = 'testSymbol';
    const expectedExchange = 'testExchange';
    const expectedBadgeColor = 'blue';

    component.badgeColor = expectedBadgeColor;

    component.selectInstrument(expectedSymbol, expectedExchange);

    expect(blotterServiceSpy.selectNewInstrument).toHaveBeenCalledOnceWith(expectedSymbol, expectedExchange, expectedBadgeColor);
  });

  it('should correctly detect if filter applied', fakeAsync(() => {
    component.filter$.next({ key1: 'val1' });

    tick();

    expect(component.isFilterApplied({ id: 'key1', displayName: '' })).toBeTrue();
    expect(component.isFilterApplied({ id: 'key2', displayName: '' })).toBeFalse();
  }));

  it('should save column width', fakeAsync(() => {
    const settings = {
      guid: 'testGuid',
      ordersTable: {
        columns: [
          { columnId: 'testId' }
        ]
      }
    };

    component.settings$ = new BehaviorSubject(settings);
    settingsServiceSpy.updateSettings.and.callThrough();

    const expectedWidth = getRandomInt(1, 50);

    component.saveColumnWidth('testId', expectedWidth);

    tick();

    expect(settingsServiceSpy.updateSettings).toHaveBeenCalledOnceWith('testGuid', {
      ordersTable: {
        columns: [
          { columnId: settings.ordersTable.columns[0].columnId, columnWidth: expectedWidth }
        ]
      }
    });
  }));

  it('should recalculate table width', () => {
    const delta = getRandomInt(50, 100);
    const expectedWidth = component.tableInnerWidth + delta;
    component.recalculateTableWidth({ columnWidth: 100, delta });

    expect(component.tableInnerWidth).toBe(expectedWidth);
  });

  it('should change column order', fakeAsync(() => {
    const settings = {
      guid: 'testGuid',
      ordersTable: {
        columns: [
          { columnId: 'testId1' },
          { columnId: 'testId2' },
        ]
      }
    };

    component.settings$ = new BehaviorSubject(settings);
    component.listOfColumns = [{ id: 'testId1' }, { id: 'testId2' }];
    settingsServiceSpy.updateSettings.and.callThrough();

    component.changeColumnOrder({previousIndex: 1, currentIndex: 2});

    tick();

    expect(settingsServiceSpy.updateSettings).toHaveBeenCalledOnceWith('testGuid', {
      ordersTable: {
        columns: [
          { columnId: settings.ordersTable.columns[0].columnId, columnOrder: 0 },
          { columnId: settings.ordersTable.columns[1].columnId, columnOrder: 1 }
        ]
      }
    });
  }));

  it('should correctly filter items', () => {
    component.listOfColumns = [
      {
        id: 'id',
        filterData: {
          filterName: 'id'
        }
      },
      {
        id: 'someKey',
        filterData: {
          filterName: 'someKey',
          isDefaultFilter: true,
          filters: ['someVal', 'anotherVal']
        }
      }
    ];
    let result: boolean;

    result = component.justifyFilter({ id: 'testId1', someKey: 'someVal' }, { id: 'test' });
    expect(result).toBeTrue();

    result = component.justifyFilter({ id: 'testId1', someKey: 'someVal' }, { id: 'testid', someKey: ['someVal'] });
    expect(result).toBeTrue();

    result = component.justifyFilter({ id: 'testId1', someKey: 'someVal' }, { someKey: ['anotherVal'] });
    expect(result).toBeFalse();

    result = component.justifyFilter({ id: 'testId1', someKey: 'someVal' }, { id: 'test', someKey: ['anotherVal'] });
    expect(result).toBeFalse();

  });
});
