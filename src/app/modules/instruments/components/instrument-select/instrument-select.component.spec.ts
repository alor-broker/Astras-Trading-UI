import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { InstrumentsService } from '../../services/instruments.service';
import { InstrumentSelectComponent } from './instrument-select.component';
import { mockComponent, sharedModuleImportForTests } from '../../../../shared/utils/testing';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import {
  BehaviorSubject,
  of
} from 'rxjs';
import { InstrumentSelectSettings } from '../../../../shared/models/settings/instrument-select-settings.model';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";

describe('InstrumentSelectComponent', () => {
  let component: InstrumentSelectComponent;
  let fixture: ComponentFixture<InstrumentSelectComponent>;
  const spyInstrs = jasmine.createSpyObj('InstrumentsService', ['getInstruments']);
  const watchlistCollectionServiceSpy = jasmine.createSpyObj('WatchlistCollectionService', ['addItemsToList']);

  const getSettingsMock = new BehaviorSubject({} as InstrumentSelectSettings);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      declarations: [
        InstrumentSelectComponent,
        mockComponent({
          selector: 'ats-watchlist-table',
          inputs: ['guid']
        })
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of(getSettingsMock)),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough(),
          }
        },
        { provide: InstrumentsService, useValue: spyInstrs },
        { provide: WatchlistCollectionService, useValue: watchlistCollectionServiceSpy },
      ]
    }).compileComponents();

  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstrumentSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
