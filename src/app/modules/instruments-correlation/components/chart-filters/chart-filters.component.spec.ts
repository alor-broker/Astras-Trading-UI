import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ChartFiltersComponent } from './chart-filters.component';
import { WatchlistCollectionService } from "../../../instruments/services/watchlist-collection.service";
import { Subject } from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  commonTestProviders,
  getTranslocoModule,
  ngZorroMockComponents,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";
import { LetDirective } from "@ngrx/component";

describe('ChartFiltersComponent', () => {
  let component: ChartFiltersComponent;
  let fixture: ComponentFixture<ChartFiltersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        sharedModuleImportForTests,
        LetDirective
      ],
      declarations: [
        ChartFiltersComponent,
        ...ngZorroMockComponents,
      ],
      providers: [
        {
          provide: WatchlistCollectionService,
          useValue: {
            getWatchlistCollection: jasmine.createSpy('getWatchlistCollection').and.returnValue(new Subject())
          }
        },
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        ...commonTestProviders
      ]
    });
    fixture = TestBed.createComponent(ChartFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
