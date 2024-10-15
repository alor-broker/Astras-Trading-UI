import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';

import { BlotterBaseTableComponent } from "./blotter-base-table.component";
import { Component, DestroyRef } from "@angular/core";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterService } from "../../services/blotter.service";
import { By } from "@angular/platform-browser";
import {
  Observable,
  of,
  Subject,
  take
} from "rxjs";
import { TableNames } from "../../models/blotter-settings.model";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { TableConfig } from "../../../../shared/models/table-config.model";
import { FilterType } from "../../../../shared/models/settings/table-settings.model";
import { NzContextMenuService } from "ng-zorro-antd/dropdown";
import { InstrumentKey } from 'src/app/shared/models/instruments/instrument-key.model';
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

@Component({
  selector: 'ats-test-comp',
  template: `
    <div class="table-container" [style]="{ height: '100%'}">
      <nz-table #nzTable></nz-table>
    </div>
  `
})
class TestComponent extends BlotterBaseTableComponent<{ id: string }, object> {
  protected rowToInstrumentKey(): Observable<InstrumentKey | null> {
      return of(null);
  }

  settingsTableName = TableNames.OrdersTable;

  constructor(
    protected readonly service: BlotterService,
    protected readonly settingsService: WidgetSettingsService,
    protected readonly translatorService: TranslatorService,
    protected readonly nzContextMenuService: NzContextMenuService,
    protected readonly destroyRef: DestroyRef
  ) {
    super(settingsService, translatorService, nzContextMenuService, destroyRef);
  }

  protected initTableConfigStream(): Observable<TableConfig<any>> {
    return of({ columns: [] });
  }

  protected initTableDataStream(): Observable<any[]> {
    return of([]);
  }
}

@Component({
  template: '<ats-test-comp [guid]="guid"></ats-test-comp>'
})
class TestWrapperComponent {
  guid = 'testGuid';
}

describe('BlotterBaseTableComponent', () => {
  let component: any;
  let hostFixture: ComponentFixture<TestWrapperComponent>;

  let blotterServiceSpy: any;
  let settingsServiceSpy: any;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    blotterServiceSpy = jasmine.createSpyObj('BlotterService', ['selectNewInstrument']);
    settingsServiceSpy = jasmine.createSpyObj('WidgetSettingsService', ['getSettings', 'updateSettings']);
    settingsServiceSpy.getSettings.and.returnValue(new Subject());

    await TestBed.configureTestingModule({
      declarations: [
        TestComponent,
        TestWrapperComponent,
        ...ngZorroMockComponents
      ],
      imports: [
        TranslocoTestsModule.getModule(),
      ],
      providers: [
        {
          provide: BlotterService,
          useValue: blotterServiceSpy
        },
        {
          provide: WidgetSettingsService,
          useValue: settingsServiceSpy
        },
        {
          provide: NzContextMenuService,
          useValue: {
            create: jasmine.createSpy('create').and.callThrough(),
            close: jasmine.createSpy('close').and.callThrough()
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    hostFixture = TestBed.createComponent(TestWrapperComponent);
    component = hostFixture.debugElement.query(By.directive(TestComponent)).componentInstance;
    hostFixture.detectChanges();
  });

  afterEach(() => hostFixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should change filter', fakeAsync(() => {
    const expectedFilter: any = { key1: 'val1', key2: ['val2'] };
    component.filterChange(expectedFilter);

    tick();

    component.filters$
      .pipe(take(1))
      .subscribe((f: any) => expect(f).toEqual(expectedFilter));

    expectedFilter.key1 = 'val3';
    expectedFilter.newKey = 'newVal';
    component.filterChange(expectedFilter);

    tick();

    component.filters$
      .pipe(take(1))
      .subscribe((f: any) => expect(f).toEqual(expectedFilter));
  }));

  it('should change default filter', () => {
    const filterChangeSpy = spyOn(component, 'filterChange').and.callThrough();

    component.defaultFilterChange('testKey', ['testValue']);
    expect(filterChangeSpy).toHaveBeenCalledOnceWith({ testKey: ['testValue'] });
  });

  it('should correctly detect if filter applied', fakeAsync(() => {
    component.filters$.next({ key1: 'val1' });

    tick();

    expect(component.isFilterApplied({ id: 'key1', displayName: '' })).toBeTrue();
    expect(component.isFilterApplied({ id: 'key2', displayName: '' })).toBeFalse();
  }));

  it('should correctly filter items', () => {
    component.columns = [
      {
        id: 'id',
        filterData: {
          filterName: 'id',
          filterType: FilterType.Search
        }
      },
      {
        id: 'someKey',
        filterData: {
          filterName: 'someKey',
          filterType: FilterType.DefaultMultiple,
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
