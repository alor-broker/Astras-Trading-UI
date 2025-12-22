import {ComponentFixture, TestBed} from '@angular/core/testing';
import {InstrumentsService} from '../../services/instruments.service';
import {InstrumentSelectComponent} from './instrument-select.component';
import {WatchlistCollectionService} from '../../services/watchlist-collection.service';
import {BehaviorSubject, of} from 'rxjs';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {WatchlistCollection} from '../../models/watchlist.model';
import {InstrumentSelectSettings} from '../../models/instrument-select-settings.model';
import {ACTIONS_CONTEXT} from "../../../../shared/services/actions-context";
import {WatchInstrumentsService} from "../../services/watch-instruments.service";
import {NzDropdownButtonDirective, NzDropDownDirective, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {
  NzAutocompleteComponent,
  NzAutocompleteOptionComponent,
  NzAutocompleteTriggerDirective
} from "ng-zorro-antd/auto-complete";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzTagComponent} from "ng-zorro-antd/tag";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzMenuDirective, NzMenuItemComponent} from "ng-zorro-antd/menu";
import {WatchlistTableComponent} from "../watchlist-table/watchlist-table.component";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('InstrumentSelectComponent', () => {
  let component: InstrumentSelectComponent;
  let fixture: ComponentFixture<InstrumentSelectComponent>;
  const spyInstrs = jasmine.createSpyObj('InstrumentsService', ['getInstruments']);
  const watchlistCollectionServiceSpy = jasmine.createSpyObj('WatchlistCollectionService', ['addItemsToList', 'collectionChanged$', 'getWatchlistCollection']);
  watchlistCollectionServiceSpy.collectionChanged$ = of({});
  watchlistCollectionServiceSpy.getWatchlistCollection.and.returnValue(new BehaviorSubject({collection: []} as WatchlistCollection));

  const getSettingsMock = new BehaviorSubject({} as InstrumentSelectSettings);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        InstrumentSelectComponent,
        ...FormsTesting.getMocks(),
        MockComponents(
          NzAutocompleteComponent,
          NzAutocompleteOptionComponent,
          NzTagComponent,
          NzButtonComponent,
          NzDropdownMenuComponent,
          NzMenuItemComponent,
          WatchlistTableComponent
        ),
        MockDirectives(
          NzAutocompleteTriggerDirective,
          NzDropdownButtonDirective,
          NzDropDownDirective,
          NzTooltipDirective,
          NzIconDirective,
          NzMenuDirective
        )
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of(getSettingsMock)),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough(),
          }
        },
        {provide: InstrumentsService, useValue: spyInstrs},
        {provide: WatchlistCollectionService, useValue: watchlistCollectionServiceSpy},
        {
          provide: ACTIONS_CONTEXT,
          useValue: {
            instrumentSelected: jasmine.createSpy('instrumentSelected').and.callThrough()
          }
        },
        {
          provide: WatchInstrumentsService,
          useValue: {
            clear: jasmine.createSpy('instrumentSelected').and.callThrough()
          }
        },
        ...commonTestProviders
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstrumentSelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
