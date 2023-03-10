import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllInstrumentsComponent } from './all-instruments.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of, Subject } from "rxjs";
import { AllInstrumentsService } from "../../services/all-instruments.service";
import {
  commonTestProviders,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";
import { WatchlistCollectionService } from "../../../instruments/services/watchlist-collection.service";
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import { TranslatorService } from '../../../../shared/services/translator.service';

describe('AllInstrumentsComponent', () => {
  let component: AllInstrumentsComponent;
  let fixture: ComponentFixture<AllInstrumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AllInstrumentsComponent,
      ],
      imports: [
        ...sharedModuleImportForTests
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({}))
          }
        },
        {
          provide: AllInstrumentsService,
          useValue: {
            getAllInstruments: jasmine.createSpy('getAllInstruments').and.returnValue(of([]))
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            instrumentsSelection$: jasmine.createSpy('instrumentsSelection$').and.returnValue(new Subject()),
            selectDashboardInstrument: jasmine.createSpy('selectDashboardInstrument').and.callThrough()
          }
        },
        {
          provide: WatchlistCollectionService,
          useValue: {
            collectionChanged$: new Subject(),
            getWatchlistCollection: jasmine.createSpy('getWatchlistCollection').and.returnValue({collection: []}),
            addItemsToList: jasmine.createSpy('addItemsToList').and.callThrough()
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: TranslatorService,
          useValue: {
            getTranslator: jasmine.createSpy('getTranslator').and.returnValue(new Subject())
          }
        },
        ...commonTestProviders
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllInstrumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
