import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllInstrumentsComponent } from './all-instruments.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of, Subject } from "rxjs";
import { AllInstrumentsService } from "../../services/all-instruments.service";
import { sharedModuleImportForTests } from "../../../../shared/utils/testing";
import { WatchlistCollectionService } from "../../../instruments/services/watchlist-collection.service";

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
          provide: WatchlistCollectionService,
          useValue: {
            collectionChanged$: new Subject(),
            getWatchlistCollection: jasmine.createSpy('getWatchlistCollection').and.returnValue({collection: []}),
            addItemsToList: jasmine.createSpy('addItemsToList').and.callThrough()
          }
        }
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
