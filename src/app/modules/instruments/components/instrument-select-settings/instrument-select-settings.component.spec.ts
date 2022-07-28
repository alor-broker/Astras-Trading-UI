import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { InstrumentSelectSettingsComponent } from './instrument-select-settings.component';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import {
  BehaviorSubject,
  Subject
} from 'rxjs';
import { InstrumentSelectSettings } from '../../../../shared/models/settings/instrument-select-settings.model';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { mockComponent, ngZorroMockComponents } from "../../../../shared/utils/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { NzSelectModule } from "ng-zorro-antd/select";
import { ReactiveFormsModule } from "@angular/forms";

describe('InstrumentSelectSettingsComponent', () => {
  let component: InstrumentSelectSettingsComponent;
  let fixture: ComponentFixture<InstrumentSelectSettingsComponent>;

  const watchlistCollectionServiceSpy = jasmine.createSpyObj('WatchlistCollectionService', ['collectionChanged$', 'getWatchlistCollection']);

  const collectionChangedMock = new Subject();
  watchlistCollectionServiceSpy.collectionChanged$ = collectionChangedMock.asObservable();

  const getSettingsMock = new BehaviorSubject({} as InstrumentSelectSettings);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        InstrumentSelectSettingsComponent,
        ...ngZorroMockComponents,
        mockComponent({
          selector: 'ats-watchlist-collection-edit'
        })
      ],
      imports: [
        NoopAnimationsModule,
        NzSelectModule,
        ReactiveFormsModule
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(getSettingsMock),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
          }
        },
        { provide: WatchlistCollectionService, useValue: watchlistCollectionServiceSpy },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstrumentSelectSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
