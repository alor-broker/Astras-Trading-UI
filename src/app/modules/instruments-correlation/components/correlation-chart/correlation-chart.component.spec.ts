import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorrelationChartComponent } from './correlation-chart.component';
import { WatchlistCollectionService } from "../../../instruments/services/watchlist-collection.service";
import { Subject } from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { InstrumentsCorrelationService } from "../../services/instruments-correlation.service";
import {
  commonTestProviders,
  getTranslocoModule,
  ngZorroMockComponents,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";
import { InstrumentsCorrelationModule } from "../../instruments-correlation.module";

describe('CorrelationChartComponent', () => {
  let component: CorrelationChartComponent;
  let fixture: ComponentFixture<CorrelationChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        ...sharedModuleImportForTests,
      ],
      declarations: [
        CorrelationChartComponent,
        ...ngZorroMockComponents
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
        {
          provide: InstrumentsCorrelationService,
          useValue: {
            getCorrelation: jasmine.createSpy('getCorrelation').and.returnValue(new Subject())
          }
        },
        ...commonTestProviders
      ]
    });
    fixture = TestBed.createComponent(CorrelationChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
