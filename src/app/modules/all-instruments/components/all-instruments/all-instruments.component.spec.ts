import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllInstrumentsComponent } from './all-instruments.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {BehaviorSubject, of, Subject} from "rxjs";
import { AllInstrumentsService } from "../../services/all-instruments.service";
import {
  commonTestProviders,
  mockComponent
} from "../../../../shared/utils/testing";
import { WatchlistCollectionService } from "../../../instruments/services/watchlist-collection.service";
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { TranslatorService } from '../../../../shared/services/translator.service';
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { ACTIONS_CONTEXT } from "../../../../shared/services/actions-context";

describe('AllInstrumentsComponent', () => {
  let component: AllInstrumentsComponent;
  let fixture: ComponentFixture<AllInstrumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AllInstrumentsComponent,
        mockComponent({
          selector: 'ats-infinite-scroll-table',
          inputs: [
            'contextMenu',
            'tableConfig',
            'tableContainerWidth',
            'tableContainerHeight',
            'data',
            'isLoading'
          ]
        })
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
          }
        },
        {
          provide: ACTIONS_CONTEXT,
          useValue: {
            instrumentSelected: jasmine.createSpy('instrumentSelected').and.callThrough()
          }
        },
        {
          provide: WatchlistCollectionService,
          useValue: {
            collectionChanged$: new Subject(),
            getWatchlistCollection: jasmine.createSpy('getWatchlistCollection').and.returnValue(new BehaviorSubject({collection: []})),
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
    component.guid = 'testGuid';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
